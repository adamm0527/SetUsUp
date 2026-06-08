
// Pastel background colors per Camelot key. Used as KeyChip's background.

// Keys are stored in the DB in "DDL" / "0DL" format (e.g. "05A"),
// we accept either that form or the trimmed display form ("5A") and normalize internally.
const KEY_COLOR_MAP: Record<string, string> = {
  '1A':  '#56F1DA', '1B':  '#01EDCA',
  '2A':  '#7DF2AA', '2B':  '#3CEE81',
  '3A':  '#AEF589', '3B':  '#86F24F',
  '4A':  '#E8DAA1', '4B':  '#DFCA73',
  '5A':  '#FEBFA7', '5B':  '#FFA07C',
  '6A':  '#FDAFB7', '6B':  '#FF8894',
  '7A':  '#FDAACC', '7B':  '#FF81B4',
  '8A':  '#F2ABE4', '8B':  '#EE82D9',
  '9A':  '#DDB4FD', '9B':  '#CE8FFF',
  '10A': '#BECDFD', '10B': '#9FB6FF',
  '11A': '#8EE4F9', '11B': '#56D9F9',
  '12A': '#55F0F0', '12B': '#00EBEB',
};

/* Returns the pastel background color for a Camelot key string, or null if the input isn't a recognized Camelot value. */
export function getKeyColor(camelot: string | null | undefined): string | null {
  if (!camelot) return null;

  // Normalize: strip leading zeros from the number portion, uppercase the suffix
  const raw = camelot.trim().toUpperCase();
  if (raw.length < 2 || raw.length > 3) return null;

  const suffix = raw[raw.length - 1];
  if (suffix !== 'A' && suffix !== 'B') return null;

  const numPart = raw.slice(0, -1);
  if (!/^\d{1,2}$/.test(numPart)) return null;

  const n = parseInt(numPart, 10);
  if (n < 1 || n > 12) return null;

  return KEY_COLOR_MAP[`${n}${suffix}`] ?? null;
}

/* Returns the canonical display form for a Camelot key ("05A" -> "5A", "5A" -> "5A").
   Returns the input unchanged if it doesn't parse. */
export function formatKeyForDisplay(camelot: string | null | undefined): string {
  if (!camelot) return '';
  const raw = camelot.trim().toUpperCase();
  if (raw.length < 2 || raw.length > 3) return raw;

  const suffix = raw[raw.length - 1];
  if (suffix !== 'A' && suffix !== 'B') return raw;

  const numPart = raw.slice(0, -1);
  if (!/^\d{1,2}$/.test(numPart)) return raw;

  const n = parseInt(numPart, 10);
  if (n < 1 || n > 12) return raw;

  return `${n}${suffix}`;
}
