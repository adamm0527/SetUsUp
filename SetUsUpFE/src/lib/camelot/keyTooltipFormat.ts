
/* Uniform tooltip formatting utilityfor everything that displays camelot key delta (transitions)
   Format: "(<sign><1/2-digits><scale-change-letter>) <description>"
   Examples: "(+7X) Up seven -- big energy push"
             "(+1C) Diagonal cross-scale transition"
             "(00X) Exact match" */


/* Human-readable description per transition atomic.
   Lower-case 'c' variants are intentional: atonal-variant distinction. */
const KEY_TRANSITION_DESCRIPTION_MAP: Record<string, string> = {
  '00X': 'Exact match',
  '+1X': 'Subtle lift',
  '-1X': 'Subtle relax',
  '00C': 'Scale flip',
  '-1C': 'Cross-scale relax',
  '+1C': 'Cross-scale lift',
  '+1c': 'Atonal cross-scale lift',
  '-1c': 'Atonal cross-scale relax',
  '+2X': 'Intense lift',
  '-2X': 'Intense relax',
  '+7X': 'Energy push reset',
  '-7X': 'Energy drop reset',
  '+3X': 'Attention grab',
  '-3X': 'Attention shift',
  '+3C': 'Mood-shifting lift',
  '-3C': 'Mood-shifting relax',
  '-4C': 'Flat-four cross-scale relax',
  '+4C': 'Flat-four cross-scale lift',
  '+4X': 'Flat-four lift',
  '+6X': 'Harmonic flip across wheel',
  'DIF': 'Different key (no harmonic match)',
};


/* Returns the description for a known atomic, or null otherwise. */
export function getKeyTransitionDescription(transitionAtomic: string | null | undefined): string | null {
  if (!transitionAtomic) return null;
  return KEY_TRANSITION_DESCRIPTION_MAP[transitionAtomic] ?? null;
}

/* Combined: takes an atomic, returns "(atomic) description" (the full transition text)
   When the atomic is null/empty, returns an empty string. */
export function formatKeyTransitionTooltip(transitionAtomic: string | null | undefined): string {
  if (!transitionAtomic) return '';
  const desc = KEY_TRANSITION_DESCRIPTION_MAP[transitionAtomic];
  return desc ? formatKeyTooltip(transitionAtomic, desc) : `(${transitionAtomic})`;
}

/* Simple wrapper when the caller knows both the delta atomic + the human description. */
export function formatKeyTooltip(transitionAtomic: string, description: string): string {
  return `(${transitionAtomic}) ${description}`;
}
