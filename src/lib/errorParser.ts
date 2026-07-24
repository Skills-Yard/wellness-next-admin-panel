/**
 * Utility to parse backend API or network errors into a human-readable string.
 */
export function parseServerError(error: any, defaultMessage: string = 'An unexpected error occurred'): string {
  if (error?.response?.data) {
    const data = error.response.data;

    // 1. Handle custom ApiErrorResponse wrapper structure:
    // { success: false, error: { code, message, details?: any[] } }
    if (data.error) {
      if (Array.isArray(data.error.details) && data.error.details.length > 0) {
        const firstDetail = data.error.details[0];
        if (typeof firstDetail === 'string') {
          return data.error.details.join(', ');
        }
        if (typeof firstDetail === 'object' && firstDetail !== null) {
          return data.error.details
            .map((detail: any) => {
              if (detail.field && detail.issue) {
                return `${detail.field}: ${detail.issue}`;
              }
              return detail.message || JSON.stringify(detail);
            })
            .join(', ');
        }
      }
      if (data.error.message) {
        return data.error.message;
      }
    }

    // 2. Handle default NestJS ValidationPipe error structure:
    // { statusCode: 400, message: string[], error: 'Bad Request' }
    if (data.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }
      return data.message;
    }
  }

  return error.message || defaultMessage;
}
