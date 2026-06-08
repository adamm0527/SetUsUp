import { useState, useEffect, useRef } from 'react';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

/* I created two separate variants of this component:
   <DisplayRatingStars value={2.7} totalRaters={5} /> - read-only, half-star precision
   <InteractiveRatingStars initialMyRating={3}        - editable, with Apply/Cancel + Clear
     onApply={(r) => ...}
     onClear={() => ...}
   />                                                 

   The PlaylistEntryRow uses the Display variant. When the row is expanded, the inline
   "Your rating:" block uses the Interactive variant. */


/* --- DISPLAY (read-only) variant --- */

interface DisplayRatingStarsProps {
  value: number | null; // current average rating in [0, 5]. 0 = no stars filled
  totalRaters: number; // total number of raters
  size?: number; // pixel size for each start (default: 18)
  noTooltip?: boolean; // caller can disable the default tooltip and wrap with their own
  onClick?: () => void;
}

export function DisplayRatingStars({
  value, totalRaters, size = 18, noTooltip = false, onClick,
}: DisplayRatingStarsProps) {
  const v = Math.max(0, Math.min(5, value ?? 0));

  const strip = (
    <Stack direction="row" spacing={0} sx={{
      alignItems: 'center', flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: 1,
      px: 0.25,
      '&:hover': onClick ? { backgroundColor: 'action.hover' } : undefined,
    }}
      aria-label={`Average rating ${v.toFixed(2)} out of 5 from ${totalRaters} members`}
      onClick={onClick}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        /* Half-star precision: this star is "filled past midpoint" when v - i >= 0.5. */
        const filled = v - i >= 0.5;
        const Icon = filled ? StarRoundedIcon : StarBorderRoundedIcon;
        return (
          <Icon key={i} sx={{
            fontSize: size,
            color: filled ? 'primary.main' : 'action.disabled',
          }} />
        );
      })}
    </Stack>
  );

  if (noTooltip) return strip;

  const tooltipText = totalRaters === 0
    ? 'No ratings yet -- click to rate'
    : `Average member rating: ${v.toFixed(2)} (by ${totalRaters} ${totalRaters === 1 ? 'member' : 'members'})`;

  return (
    <Tooltip arrow disableInteractive title={tooltipText}>
      <span>{strip}</span>
    </Tooltip>
  );
}


/* --- INTERACTIVE variant (click to set, has optional Clear button --- */

interface InteractiveRatingStarsProps {
  initialMyRating: number | null; // user's existing rating (null if not rated)
  onApply: (newRating: number) => void | Promise<void>; // called when Apply clicked with a non-null rating
  onClear?: () => void | Promise<void>; // called when Clear clicked (e.g. removes existing rating)
  isPending?: boolean; // if true, Apply button shows spinner and all buttons stay disabled
  size?: number; // pixel size for each start (default: 22, slightly larger than Display variant)
}


export function InteractiveRatingStars({
  initialMyRating, onApply, onClear, isPending = false, size = 22,
}: InteractiveRatingStarsProps) {
  /* Optimistic local value shown immediately on click, reconciled from initialMyRating
     prop whenever the caller (PlaylistEntryDetails) reports a fresh BE value after invalidate. */
  const [shown, setShown] = useState<number | null>(initialMyRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const lastInitial = useRef<number | null>(initialMyRating);

  /* replace local optimistic state with the prop when mount/entry switch */
  useEffect(() => {
    if (lastInitial.current !== initialMyRating) {
      lastInitial.current = initialMyRating;
      setShown(initialMyRating);
    }
  }, [initialMyRating]);

  const renderValue = hoverRating ?? shown ?? 0;

  const handleStarClick = async (i: number) => {
    if (isPending) return;
    const previous = shown;
    setShown(i); // optimistic
    try {
      await onApply(i);
    } catch {
      setShown(previous); // revert
    }
  };

  const handleClear = async () => {
    if (isPending || !onClear) return;
    const previous = shown;
    setShown(null); // optimistic
    try {
      await onClear();
    } catch {
      setShown(previous);
    }
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        Your rating: <span style={{ opacity: 0.7 }}>(click a star to save)</span>
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Stack direction="row" spacing={0}
          onMouseLeave={() => setHoverRating(null)}
          aria-label="Click a star to save your rating">
          {[1, 2, 3, 4, 5].map((i) => {
            const filled = i <= renderValue;
            const Icon = filled ? StarRoundedIcon : StarBorderRoundedIcon;
            return (
              <Tooltip key={i} arrow disableInteractive title={`Rate ${i} of 5`}>
                <Box
                  component="span"
                  onMouseEnter={() => setHoverRating(i)}
                  onClick={() => void handleStarClick(i)}
                  sx={{
                    display: 'inline-flex',
                    cursor: isPending ? 'wait' : 'pointer',
                    transition: 'transform 80ms ease',
                    '&:hover': { transform: isPending ? 'none' : 'scale(1.15)' },
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: size,
                      color: filled ? 'primary.main' : 'action.disabled',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Stack>

        {/* Clear button */}
        {shown !== null && onClear && (
          <Button
            size="small"
            variant="text"
            color="error"
            onClick={() => void handleClear()}
            disabled={isPending}
            sx={{ textTransform: 'none' }}
          >
            Clear my rating
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export default DisplayRatingStars;
