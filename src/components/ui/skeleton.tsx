import * as React from "react";
import { cn } from "../../lib/utils";

// The one loading placeholder for the whole app — a muted block with a light sweep animating
// across it (see @keyframes shimmer in globals.css). Every "Loading..." spinner/empty state in
// the codebase should render one or more of these (sized/shaped like the content it's standing in
// for) instead of a spinner, so a loading table looks like a table, a loading card looks like a
// card, etc.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-lg bg-[#F2E5D9]/70", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    </div>
  );
}

// A single line of placeholder text.
function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3.5 rounded-md", className)} />;
}

// Avatar/icon/thumbnail placeholder.
function SkeletonCircle({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-full shrink-0", className)} />;
}

// Stand-in for a table row shaped like the [thumbnail+name, ...meta columns, status, actions]
// rows used throughout the catalogue/zones/partners/users tables — pass `columns` to match
// however many plain text columns the real table has between the leading avatar cell and the
// trailing status/action cells.
function SkeletonTableRow({ columns = 2, withAvatar = true }: { columns?: number; withAvatar?: boolean }) {
  return (
    <tr>
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {withAvatar && <SkeletonCircle className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl" />}
          <div className="space-y-2 flex-1 min-w-0">
            <SkeletonText className="w-32 sm:w-40" />
            <SkeletonText className="w-20 sm:w-24 h-2.5" />
          </div>
        </div>
      </td>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4 sm:px-6">
          <SkeletonText className="w-12 mx-auto" />
        </td>
      ))}
      <td className="py-4 px-4 sm:px-6">
        <Skeleton className="h-6 w-16 rounded-full mx-auto" />
      </td>
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </td>
    </tr>
  );
}

// Full table body of skeleton rows — drop straight in where `loading` currently short-circuits to
// a spinner, keeping the real <table>/<thead> mounted so the header doesn't flash away.
function SkeletonTableRows({ rows = 4, columns = 2, withAvatar = true }: { rows?: number; columns?: number; withAvatar?: boolean }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} withAvatar={withAvatar} />
      ))}
    </>
  );
}

// Card-shaped placeholder (stat tiles, dashboard cards, grid items).
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-5 space-y-3", className)}>
      <SkeletonCircle className="w-9 h-9" />
      <SkeletonText className="w-2/3" />
      <SkeletonText className="w-1/3 h-5" />
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonTableRow, SkeletonTableRows, SkeletonCard };
