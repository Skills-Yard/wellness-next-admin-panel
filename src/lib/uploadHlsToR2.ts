import { getUploadUrlServerAction } from './server-actions/media';

export interface HlsUploadResult {
  url: string;
  r2Key: string;
}

export interface HlsUploadProgress {
  uploaded: number;
  total: number;
}

// Safety nets only — the presigned-PUT flow itself has no server-side size cap (unlike the old
// deprecated multipart /media/upload endpoint, which had a 5MB Multer limit). These just stop an
// obviously-wrong selection (e.g. picking a whole export folder by mistake) from silently kicking
// off hundreds of uploads.
const MAX_SEGMENT_BYTES = 15 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 300 * 1024 * 1024;

function mb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

// Mirrors R2StorageService's constructR2KeyForSignedURL on the backend *exactly* (including its
// quirk of lowercasing only the extension it compares against, not the filename it matches
// against — an upper-case extension like "Segment.TS" leaves the whole name un-stripped and
// falls through into the lowercase+dash pass below). We need to predict the exact filename R2
// will store each segment under so the manifest we upload references the right names.
function predictStoredFileName(fileName: string): string {
  const fileExt = (fileName.split('.').pop() || '').toLowerCase();
  const baseName = fileName.replace(`.${fileExt}`, '');
  const cleanFileName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${cleanFileName}.${fileExt}`;
}

// The backend's GetUploadUrlDto only accepts contentType values starting with "image/", "video/",
// or the two HLS manifest mimetypes — File.type is unreliable for less common extensions like
// .ts/.m4s (some browsers report "" for these), so segment content types are assigned explicitly
// rather than trusted from the picked File.
function contentTypeFor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'm3u8':
      return 'application/vnd.apple.mpegurl';
    case 'ts':
      return 'video/mp2t';
    case 'mp4':
    case 'm4s':
    case 'm4v':
      return 'video/mp4';
    default:
      // Deliberately not defaulted to a video/* type: an extension we don't recognize should
      // fail loudly (via the backend's contentType validation) rather than get uploaded under a
      // guessed mimetype that might be wrong.
      return `application/octet-stream;ext=${ext || 'unknown'}`;
  }
}

/**
 * Uploads a single-rendition HLS package (one .m3u8 media playlist + its .ts/.mp4 segments) to
 * R2, grouped under a shared videoId folder (see R2StorageService's `videoId` param — built on
 * the backend specifically for this) so the manifest's relative segment references keep
 * resolving once served from the CDN.
 *
 * Deliberately out of scope: multi-bitrate master playlists (#EXT-X-STREAM-INF) and fMP4/CMAF
 * segments (#EXT-X-MAP init segments) — both rejected with an explicit error rather than
 * silently producing a manifest that won't play. Most free mp4-to-HLS converters emit a single
 * rendition of plain MPEG-TS segments, which is what this supports.
 */
export async function uploadHlsPackageToR2(
  files: File[],
  slug: string | undefined,
  onProgress?: (progress: HlsUploadProgress) => void
): Promise<HlsUploadResult> {
  const manifests = files.filter(f => f.name.toLowerCase().endsWith('.m3u8'));
  if (manifests.length === 0) {
    throw new Error('No .m3u8 playlist found in the selected files.');
  }
  if (manifests.length > 1) {
    throw new Error('Multiple .m3u8 files were selected. Only a single-rendition HLS package (one playlist + its segments) is supported.');
  }
  const manifestFile = manifests[0];
  const segmentFiles = files.filter(f => f !== manifestFile);
  if (segmentFiles.length === 0) {
    throw new Error('The playlist was selected without its segment files. Select the .m3u8 together with every .ts segment it references.');
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_PACKAGE_BYTES) {
    throw new Error(`This HLS package is ${mb(totalBytes)}MB, which exceeds the ${mb(MAX_PACKAGE_BYTES)}MB package limit.`);
  }
  const oversized = files.find(f => f.size > MAX_SEGMENT_BYTES);
  if (oversized) {
    throw new Error(`"${oversized.name}" is ${mb(oversized.size)}MB, which exceeds the ${mb(MAX_SEGMENT_BYTES)}MB per-file limit.`);
  }

  const manifestText = await manifestFile.text();
  const lines = manifestText.split(/\r?\n/);

  if (lines.some(l => l.trim().startsWith('#EXT-X-STREAM-INF'))) {
    throw new Error('This is a multi-bitrate master playlist (#EXT-X-STREAM-INF). Export a single quality level from your converter instead.');
  }
  if (lines.some(l => l.trim().startsWith('#EXT-X-MAP'))) {
    throw new Error("This playlist uses fMP4/CMAF segments (#EXT-X-MAP init segment), which isn't supported yet. Export MPEG-TS (.ts) segments instead.");
  }

  const segmentsByLowerName = new Map(segmentFiles.map(f => [f.name.toLowerCase(), f]));
  const rewrittenLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
      throw new Error(`The playlist references an absolute URL ("${trimmed}") — only local segment files selected alongside it are supported.`);
    }
    const baseName = trimmed.split('/').pop()!;
    const match = segmentsByLowerName.get(baseName.toLowerCase());
    if (!match) {
      throw new Error(`The playlist references "${trimmed}" but that file wasn't part of the selection.`);
    }
    return predictStoredFileName(match.name);
  });

  // Fresh id per upload (rather than reusing one tied to the campaign) so a re-upload lands
  // under a brand-new key instead of overwriting one the CDN has already cached immutably.
  const videoId = `${(slug || 'campaign').toLowerCase()}-${Date.now()}`;
  const CACHE_CONTROL = 'public, max-age=31536000, immutable';
  const total = segmentFiles.length + 1;
  let uploaded = 0;
  onProgress?.({ uploaded, total });

  const putOne = async (file: File, fileName: string, contentType: string) => {
    const signed = await getUploadUrlServerAction({
      fileName,
      contentType,
      module: 'campaigns',
      slug,
      videoId,
    });
    if (!signed.ok) {
      throw new Error(signed.message ? `${fileName}: ${signed.message}` : `Could not get an upload URL for ${fileName}`);
    }
    const put = await fetch(signed.data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'Cache-Control': CACHE_CONTROL },
      body: file,
    });
    if (!put.ok) {
      throw new Error(`Upload of ${fileName} failed (HTTP ${put.status})`);
    }
    uploaded += 1;
    onProgress?.({ uploaded, total });
    return signed.data;
  };

  // Segments first, manifest last: if a segment fails partway through, we bail out before ever
  // publishing a manifest that points at segments that don't exist in R2 yet.
  for (const file of segmentFiles) {
    await putOne(file, file.name, contentTypeFor(file.name));
  }

  const rewrittenManifest = new File([rewrittenLines.join('\n')], manifestFile.name, {
    type: 'application/vnd.apple.mpegurl',
  });
  const manifestResult = await putOne(rewrittenManifest, manifestFile.name, 'application/vnd.apple.mpegurl');

  return { url: manifestResult.cdnUrl, r2Key: manifestResult.r2Key };
}
