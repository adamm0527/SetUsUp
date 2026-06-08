import { Box, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { KeyChip } from '#root/components';
import { useEndpointQuery } from '#root/api/queryHooks';
import { api_SongRelatedKeys } from '#root/api/endpoints';
import { formatKeyTooltip, getKeyTransitionDescription } from '#root/lib/camelot/keyTooltipFormat';
import type { SongRelatedKeys } from '#root/lib/types';


interface RelatedKeysSectionProps {
  songId: string;
  /* keys currently in the filter (for "Already in filter" visual emphasis) */
  filterKeys: string[];
  /* called when the user clicks a related-key chip --> the page TOGGLES the key in the filter bar. */
  onKeyClick: (storedKey: string) => void;
}


interface Suggestion {
  storedKey: string; // "DDL" form
  transitionAtomic: string; // 3-char delta code (e.g. "+7X", "-3C")
  description: string; // human-friendly suffix for the tooltip
}


/* Renders the related-key suggestions for a song. Clicking a chip TOGGLES the key in the filter:
   if it's already in the filter the click removes it, otherwise it adds it.
   Visual emphasis (primary-coloured ring on the chip) indicates current filter membership.
 
  The sections (4 of them) group suggestions by the kind of harmonic move:
    1. Exact / Perfect matches  -- the song's own key and the BE's PerfectMatches list
    2. Energy moves             -- same-scale stepwise moves that shift energy
    3. Mood & scale shifts      -- cross-scale (A<->B) moves
    4. Distant / harmonic moves -- flat-four-up, harmonic flip + the SimilarMatches list */
export default function RelatedKeysSection({ songId, filterKeys, onKeyClick }: RelatedKeysSectionProps) {
  const query = useEndpointQuery(
    ['songs', songId, 'related-keys'],
    api_SongRelatedKeys,
    { songId },
    { enabled: !!songId, staleTime: 60_000 }
  );

  if (query.isLoading) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Related keys</Typography>
        <Skeleton variant="rounded" height={32} />
      </Box>
    );
  }

  const data = query.data?.success ? query.data.data : null;

  if (!data) {
    // 204 NoContent -> song has no key set yet
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Related keys</Typography>
        <Typography variant="body2" color="text.secondary">
          Set the song's initial key to see related-key suggestions.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Related keys</Typography>
      <Stack spacing={1}>
        <Section title="Exact / perfect matches"
          suggestions={buildExact(data)} filterKeys={filterKeys} onKeyClick={onKeyClick} />
        <Section title="Energy moves (same scale)"
          suggestions={buildEnergy(data)} filterKeys={filterKeys} onKeyClick={onKeyClick} />
        <Section title="Mood & scale shifts (A ↔ B)"
          suggestions={buildMood(data)} filterKeys={filterKeys} onKeyClick={onKeyClick} />
        <Section title="Distant / harmonic moves"
          suggestions={buildDistant(data)} filterKeys={filterKeys} onKeyClick={onKeyClick} />
      </Stack>
    </Box>
  );
}


function Section({
  title, suggestions, filterKeys, onKeyClick,
}: {
  title: string;
  suggestions: Suggestion[];
  filterKeys: string[];
  onKeyClick: (key: string) => void;
}) {
  if (suggestions.length === 0)
    return null;

  const sortedSuggestions = [...suggestions].sort((a, b) => a.storedKey.localeCompare(b.storedKey));

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {title}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {sortedSuggestions.map((s, ix) => {
          const inFilter = filterKeys.includes(s.storedKey);
          const tooltipText = inFilter
            ? `${formatKeyTooltip(s.transitionAtomic, s.description)} â€” click to remove from filter`
            : formatKeyTooltip(s.transitionAtomic, s.description);
          return (
            <Tooltip key={`${s.storedKey}:${s.transitionAtomic}:${ix}`} title={tooltipText}
              arrow disableInteractive
            >
              <Box>
                <KeyChip initKey={s.storedKey}
                  onClick={() => onKeyClick(s.storedKey)} emphasized={inFilter}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}


/* Each builder maps a slice of the SongRelatedKeys DTO to a list of Suggestion records.
   Keys are normalised to canonical "DDL" form so they match what the filter store stores. */
function buildExact(d: SongRelatedKeys): Suggestion[] {
  const exact = ensureStored(d.exactMatch);
  const drop = ensureStored(d.drop);
  const boost = ensureStored(d.boost);
  const scale = ensureStored(d.scale);
  const diagonal = ensureStored(d.diagonal);
  const diagAtomic = d.isDiagonalDown ? '-1C' : '+1C';

  const classify = (stored: string): { atomic: string; description: string } => {
    if (stored === exact)    return atomicDesc('00X');
    if (stored === drop)     return atomicDesc('-1X');
    if (stored === boost)    return atomicDesc('+1X');
    if (stored === scale)    return atomicDesc('00C');
    if (stored === diagonal) return atomicDesc(diagAtomic);
    return { atomic: '00X', description: 'Perfect harmonic match' }; // fallback
  };

  const out: Suggestion[] = [];
  const seen = new Set<string>();

  /* Always seed with the song's own key first so it sorts to a stable spot */
  if (exact.length > 0) {
    const { atomic, description } = atomicDesc('00X');
    out.push({ storedKey: exact, transitionAtomic: atomic, description });
    seen.add(exact);
  }

  for (const k of d.perfectMatches) {
    const stored = ensureStored(k);
    if (!stored || seen.has(stored)) continue;
    seen.add(stored);
    const { atomic, description } = classify(stored);
    out.push({ storedKey: stored, transitionAtomic: atomic, description });
  }

  return out;
}

function buildEnergy(d: SongRelatedKeys): Suggestion[] {
  return [
    { storedKey: ensureStored(d.boost),             transitionAtomic: '+1X', description: 'Subtle lift' },
    { storedKey: ensureStored(d.drop),              transitionAtomic: '-1X', description: 'Subtle relax' },
    { storedKey: ensureStored(d.energyBoostBig),    transitionAtomic: '+2X', description: 'Intense lift' },
    { storedKey: ensureStored(d.energyDropBig),     transitionAtomic: '-2X', description: 'Intense relax' },
    { storedKey: ensureStored(d.energyBoost),       transitionAtomic: '+7X', description: 'Energy push reset' },
    { storedKey: ensureStored(d.energyDrop),        transitionAtomic: '-7X', description: 'Energy drop reset' },
    { storedKey: ensureStored(d.payAttentionPlus),  transitionAtomic: '+3X', description: 'Attention grab' },
    { storedKey: ensureStored(d.payAttentionMinus), transitionAtomic: '-3X', description: 'Attention shift' },
  ];
}

function buildMood(d: SongRelatedKeys): Suggestion[] {
  const moodAtomic = d.isMoodShiftMajorDown ? '-3C' : '+3C';
  const diagAtomic = d.isDiagonalDown ? '-1C' : '+1C';
  const flatScaleAtomic = d.isFlatFourMinorDown ? '-4C' : '+4C';

  return [
    { storedKey: ensureStored(d.scale),          transitionAtomic: '00C', description: 'Scale flip' },
    { storedKey: ensureStored(d.moodShift),      transitionAtomic: moodAtomic, description: 'Mood-shifting cross-scale transition' },
    { storedKey: ensureStored(d.diagonal),       transitionAtomic: diagAtomic, description: 'Cross-scale energy transition' },
    { storedKey: ensureStored(d.diagonalAtonal), transitionAtomic: d.isDiagonalDown ? '+1c' : '-1c', description: 'Atonal cross-scale energy transition' },
    { storedKey: ensureStored(d.flatFourScale),  transitionAtomic: flatScaleAtomic, description: 'Flat-four cross-scale transition' },
  ];
}

function buildDistant(d: SongRelatedKeys): Suggestion[] {
  const out: Suggestion[] = [
    { storedKey: ensureStored(d.flatFourUp),   transitionAtomic: '+4X', description: 'Same-scale flat-four' },
    { storedKey: ensureStored(d.harmonicFlip), transitionAtomic: '+6X', description: 'Opposite side of the wheel' },
  ];

  /* similarMatches may overlap with anything above:
     dedupe against the union of all keys we've already shown in this and prior sections. */
  const seen = new Set<string>(out.map((s) => s.storedKey));
  for (const k of d.similarMatches) {
    const stored = ensureStored(k);
    if (seen.has(stored)) continue;
    seen.add(stored);
    out.push({ storedKey: stored, transitionAtomic: 'DIF', description: 'Other similar match' });
  }
  return out;
}


/* Normalizes e.g. "5A" or "05A" to canonical "05A" so it matches the filter store's stored form. */
function ensureStored(s: string | null | undefined): string {
  if (!s) return '';
  const m = s.match(/^0?(\d{1,2})([AB])$/i);
  if (!m) return s;
  return `${String(parseInt(m[1], 10)).padStart(2, '0')}${m[2].toUpperCase()}`;
}

function atomicDesc(atomic: string): { atomic: string; description: string } {
  return { atomic, description: getKeyTransitionDescription(atomic) ?? atomic };
}
