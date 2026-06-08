
// Maps a Domain MusicalKeyTransition string to the corresponding SVG filename (inside public/key_icons).
// Used by the PlaylistEntryRow container to render an animated transition glyph between adjacent entries.

// Lowercase 'c' in two of the keys is intentional:
// it matches the Domain's distinction between Atonal and standard diagonal transitions.
const KEY_TRANSITION_ICON_MAP: Record<string, string> = {
  '00X': 'ExactMatch',
  '+1X': 'Boost',
  '-1X': 'Drop',
  '00C': 'Scale',
  '-1C': 'DiagonalMinorDown',
  '+1C': 'DiagonalMajorUp',
  '+1c': 'DiagonalAtonalMinorUp',
  '-1c': 'DiagonalAtonalMajorDown',
  '+2X': 'EnergyBoostBig',
  '-2X': 'EnergyDropBig',
  '+7X': 'EnergyBoost',
  '-7X': 'EnergyDrop',
  '+3X': 'PayAttentionPlus',
  '-3X': 'PayAttentionMinus',
  '+3C': 'MoodShiftMinorUp',
  '-3C': 'MoodShiftMajorDown',
  '-4C': 'FlatMinorToMajorDown',
  '+4C': 'FlatMajorToMinorUp',
  '+4X': 'FlatFourUp',
  '+6X': 'HarmonicFlip',
  'DIF': 'Different',
};

/* Returns the SVG public path for a given transition atomic value,
   or the Indeterminate placeholder when the transition is null/unknown.
   Example: getKeyTransitionIconUrl("+2X") -> "/key_icons/EnergyBoostBig.svg" */
export function getKeyTransitionIconUrl(transitionAtomic: string | null | undefined): string | null {
  if (!transitionAtomic) return '/key_icons/Indeterminate.svg';
  const fileName = KEY_TRANSITION_ICON_MAP[transitionAtomic];
  if (!fileName) return '/key_icons/Indeterminate.svg';
  return `/key_icons/${fileName}.svg`;
}
