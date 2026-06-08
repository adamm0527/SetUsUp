import { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment,
  ListItem, ListItemAvatar, ListItemText, Paper, Stack, TextField, Tooltip,
  Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LibraryMusicRoundedIcon from '@mui/icons-material/LibraryMusicRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { api_SpotifySearch, api_SpotifyLookup, api_UserProfileGet,
  api_UserLegalAcceptSpotifyNotice } from '#root/api/endpoints';
import { type SpotifyTrack } from '#root/lib/types';
import { useAppSnackbar } from '#root/providers';
import { useQueryClient } from '@tanstack/react-query';
import { CURRENT_SPOTIFY_NOTICE_VERSION } from '#root/lib/legal/constants';


export interface SpotifyAutoFillFields {
  spotifySongId: string;
  artist: string;
  title: string;
  album: string;
  durationMs: number;
  coverUrl: string | null;
  bpm: number | null;
  initKey: string | null;
}


interface SpotifyLinkSearchProps {
  /* called when the user picks a candidate (we already did the lookup) */
  onAutoFill: (fields: SpotifyAutoFillFields, mode: 'fill-missing' | 'overwrite-all') => void;
  /* shown on the trigger button when a song is already linked */
  currentLinkedId?: string | null;
}


const MIN_QUERY_LEN = 5;
const DEBOUNCE_MS = 1000;


/* The user-facing notice about how Spotify auto-fill works. Shown:
   - as a forced-acknowledgement modal on FIRST use (acceptedSpotifyNoticeVersion < CURRENT)
   - as a hoverable info-icon tooltip next to the search field on every use thereafter
   KEEP IN SYNC with the equivalent paragraph in the Privacy Notice / Terms of Service. */
const SPOTIFY_LOOKUP_NOTICE =
  "Auto-filling from Spotify captures the metadata once, thereafter it's stored as " +
  "your own observations and will not re-sync with Spotify. You are responsible for keeping it " +
  "accurate. If Spotify later removes or alters the linked track, the app will automatically " +
  "unlink the Spotify reference (cover, audio embed) on its next access, but your edited fields (artist, " +
  "title, BPM, key, tags) remain intact. You can re-link manually at any time.";

/* Inline Spotify search + result picker for the song create/edit form.
   - Search input debounces by 1000ms once 5+ characters are typed.
   - Each result row shows cover thumbnail, artist, title, album, duration.
   - Picking a result triggers a lookup call to fetch BPM/Camelot key
     (which we override from the augmentation source, RapidAPI), then calls onAutoFill with the full fields.
   - Two action buttons inside each result row: "Fill missing" (only empty form fields) and "Overwrite all". */
export default function SpotifyLinkSearch({ onAutoFill, currentLinkedId }: SpotifyLinkSearchProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [lookupBusyId, setLookupBusyId] = useState<string | null>(null);

  const search = useEndpointMutation(api_SpotifySearch);
  const lookup = useEndpointMutation(api_SpotifyLookup);

  /* Notice gating. Reads the same ['user', 'profile'] cache the NavBar and AuthLayout use.
    "needsFirstTimeNotice" flips to false the moment the user accepts (after the invalidate below) */
  const profileQuery = useEndpointQuery(['user', 'profile'], api_UserProfileGet);
  const profile = profileQuery.data?.success ? profileQuery.data.data : null;
  const needsFirstTimeNotice = profile != null && profile.acceptedSpotifyNoticeVersion < CURRENT_SPOTIFY_NOTICE_VERSION;
  const [noticeTicked, setNoticeTicked] = useState(false);
  const acceptNotice = useEndpointMutation(api_UserLegalAcceptSpotifyNotice);
  const handleAcceptNotice = async () => {
    const res = await acceptNotice.mutateAsync({ body: { version: CURRENT_SPOTIFY_NOTICE_VERSION } });
    if (res.success) {
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    } else {
      snackbar.error('Could not record your acceptance. Try again.');
    }
  };

  const searchRef = useRef(search);
  const snackbarRef = useRef(snackbar);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { snackbarRef.current = snackbar; }, [snackbar]);

  /* Debounced search; only fires when the trimmed query is >= MIN_QUERY_LEN characters
     AND the user has stopped typing for DEBOUNCE_MS. */
  const lastQueryRef = useRef<string>('');
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LEN) {
      /* Functional updates so we don't re-render unless the value actually changed */
      setResults((prev) => (prev.length === 0 ? prev : []));
      setSearching((prev) => (prev ? false : prev));
      return;
    }

    const handle = setTimeout(async () => {
      if (trimmed === lastQueryRef.current) return;
      lastQueryRef.current = trimmed;
      setSearching(true);

      const resp = await searchRef.current.mutateAsync({ params: { q: trimmed, limit: 10 } });
      setSearching(false);

      if (resp.success) {
        setResults(resp.data ?? []);
      } else {
        const msg = resp.errorBody && 'message' in resp.errorBody
          ? (resp.errorBody as { message?: string }).message
          : null;
        snackbarRef.current.error(msg ?? 'Spotify search failed.');
        setResults([]);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);


  const handlePick = async (track: SpotifyTrack, mode: 'fill-missing' | 'overwrite-all') => {
    setLookupBusyId(track.id);
    const lookupResp = await lookup.mutateAsync({ params: { spotifySongId: track.id } });
    setLookupBusyId(null);

    if (!lookupResp.success) {
      snackbar.warning(`Spotify metadata loaded, but bpm/key fetch failed.`);
      // still proceed with what we have from the search result
      onAutoFill(buildFields(track), mode);
      return;
    }
    onAutoFill(buildFields(lookupResp.data!), mode);
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'background.default' }}>
      <Stack spacing={1}>
        {/* Search field with a trailing info-icon (shown when first-time notice has already been accepted). */}
        <Stack direction="row" alignItems="flex-start" spacing={0.5}>
          <TextField size="small" fullWidth placeholder="Search Spotify (min 5 chars)"
            value={query} onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {searching ? <CircularProgress size={16} />
                      : query.length > 0 ? (
                        <IconButton size="small" onClick={() => setQuery('')}><CloseRoundedIcon fontSize="small" /></IconButton>
                      ) : null}
                  </InputAdornment>
                ),
              }
            }}
            helperText={
              currentLinkedId
                ? `Already linked to Spotify (track ID: ${currentLinkedId}). Search again to re-link.`
                : 'Picks here will auto-fill the form below. You can still edit any field afterward.'
            }
          />
          
          {!needsFirstTimeNotice && (
            <Tooltip arrow title={
              <Typography variant="caption" sx={{ display: 'block', maxWidth: 320 }}>
                {SPOTIFY_LOOKUP_NOTICE}
              </Typography>}
            >
              <IconButton size="small" sx={{ mt: 0.5 }} aria-label="About Spotify auto-fill">
                <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {results.length > 0 && (
          <Box sx={{ maxHeight: 320, overflow: 'auto', borderTop: 1, borderColor: 'divider' }}>
            {results.map((t) => (
              <ListItem
                key={t.id}
                disablePadding
                sx={{ alignItems: 'flex-start', py: 1, borderBottom: 1, borderColor: 'divider' }}
                secondaryAction={
                  <Stack direction="column" spacing={0.5}>
                    <Tooltip title="Fill only fields that are still empty" arrow disableInteractive>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handlePick(t, 'fill-missing')}
                        disabled={lookupBusyId === t.id}
                        sx={{ textTransform: 'none', minWidth: 110 }}
                      >
                        {lookupBusyId === t.id ? <CircularProgress size={14} color="inherit" /> : 'Fill missing'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Overwrite all current form values" arrow disableInteractive>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handlePick(t, 'overwrite-all')}
                        disabled={lookupBusyId === t.id}
                        sx={{ textTransform: 'none', minWidth: 110 }}
                      >
                        Overwrite all
                      </Button>
                    </Tooltip>
                  </Stack>
                }
              >
                <ListItemAvatar sx={{ minWidth: 56 }}>
                  {t.coverUrl
                    ? <Avatar variant="rounded" src={t.coverUrl} sx={{ width: 48, height: 48 }} />
                    : <Avatar variant="rounded" sx={{ width: 48, height: 48 }}><LibraryMusicRoundedIcon /></Avatar>
                  }
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.5 }}>
                        {t.artist}
                      </Box>
                      {t.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {t.album} · {formatMs(t.durationMs)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </Box>
        )}

        {!searching && query.trim().length >= MIN_QUERY_LEN && results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1, textAlign: 'center' }}>
            No tracks found for "{query}".
          </Typography>
        )}
      </Stack>
      {/* First-time notice modal. Non-dismissible until the user ticks the checkbox and presses "Got it". */}
      {needsFirstTimeNotice && (
        <Dialog open maxWidth="sm" fullWidth disableEscapeKeyDown slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>About Spotify auto-fill</DialogTitle>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2 }}>
              First time using auto-fill — please read the following once.
            </Alert>
            <Typography variant="body2" gutterBottom>{SPOTIFY_LOOKUP_NOTICE}</Typography>
            <FormControlLabel
              control={<Checkbox checked={noticeTicked} onChange={(_e, v) => setNoticeTicked(v)} />}
              label={<Typography variant="body2">I understand.</Typography>}
            />
          </DialogContent>
          <DialogActions>
            <Button variant="contained" disabled={!noticeTicked || acceptNotice.isPending} onClick={handleAcceptNotice}
              startIcon={acceptNotice.isPending ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{ textTransform: 'none' }}
            >
              Got it
            </Button>
          </DialogActions>
        </Dialog>
      )}      
    </Paper>
  );
}


function buildFields(t: SpotifyTrack): SpotifyAutoFillFields {
  return {
    spotifySongId: t.id,
    artist: t.artist,
    title: t.title,
    album: t.album,
    durationMs: t.durationMs,
    coverUrl: t.coverUrl,
    bpm: t.bpm,
    initKey: t.initKey,
  };
}

function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
