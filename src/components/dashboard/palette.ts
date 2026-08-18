// Chart colors for the dashboard — chosen and validated per the dataviz skill:
// `node scripts/validate_palette.js "<hexes>" --mode light --surface "#FFFFFF"` reports
// ALL CHECKS PASS for both sets below (lightness band, chroma floor, CVD adjacent-pair
// separation, normal-vision floor). Because a couple of slots land under the 3:1 contrast
// floor against a white surface (a WARN, not a FAIL), every chart using these always ships a
// visible label/legend next to the color — never color as the only signal.

// Categorical — fixed order, brand-anchored (slot 1 is the app's own gold accent). Used for
// "Bookings by Service Category" (up to 5 slices) and "New vs Returning Customers" (first 2).
export const CATEGORY_COLORS = ['#C68A4C', '#2a78d6', '#1baf7a', '#A9431E', '#e87ba4'];

// Status — semantic, not positional: each color means the same booking state everywhere it
// appears, kept visually distinct from CATEGORY_COLORS so the two donuts on one screen are never
// confused for the same dimension. "Completed" reuses the app's existing "active" green. "Other"
// (6th slot) catches any raw booking status the backend adds that isn't grouped above yet —
// re-validated as a 6-color set, not just the original 5 plus an untested extra.
export const STATUS_COLORS: Record<string, string> = {
  'Completed': '#2E7D32',
  'Confirmed & In Progress': '#2a78d6',
  'Pending Payment': '#eda100',
  'Cancelled': '#EF4444',
  'Refunded': '#6E5FC4',
  'Other': '#009999',
};

export const CHART_INK = {
  primary: '#1C1512',
  secondary: '#6B6660',
  muted: '#A69A8D',
  gridline: '#F0EBE4',
};
