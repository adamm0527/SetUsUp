import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, Link, Paper,
  Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink } from '@tanstack/react-router';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { api_UserProfileGet, api_UserInstagramPatch, api_UserPasswordPatch,
  api_UserEmailRequestChange, api_UserDataExport, api_UserLogout,
  api_UserDelete, api_UserDisplayedTagGroupsPatch, api_TagsGetAll } from '#root/api/endpoints';
import { useAppSnackbar } from '#root/providers';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthTokenStore } from '#root/clientdata/stores';
import { useNavigate } from '@tanstack/react-router';
import SpotifyAttribution from '#root/components/spotify/SpotifyAttribution';
import { EmailField, PasswordField } from '#root/components';
import { CURRENT_LEGAL_VERSION } from '#root/lib/legal/constants';
import { ROUTES_PUBLIC } from '#root/lib/constants';
import { loginWithEmailSchema, INVALID_EMAIL_MESSAGE,
  EMPTY_PASSWORD_MESSAGE } from '#root/lib/validation/loginSchema';
import { getCategoryIconByGroupOrTagId } from '#root/lib/camelot/tagCategoryIcons';
import type { TagCategoryList, UserProfile } from '#root/lib/types';


/* The user's settings page. Single column, sectioned. Sections in display order:
     1. Account            (username read-only, email change via EmailField, lastLoginAt + inactivity countdown)
     2. Password           (current + new + repeat via shared form components + loginSchema validation)
     3. Instagram          (single editable field)
     4. Tag display        (up-to-5 TagGroups chooser for SongCard chip strips)
     5. Spotify            (static disclosure of how playback works)
     6. Legal              (versions accepted, links to current docs)
     7. Data & privacy     (export, danger-zone delete) */
export default function UserSettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { clearJwt } = useAuthTokenStore();

  const profileQuery = useEndpointQuery(['user', 'profile'], api_UserProfileGet);
  const profile = profileQuery.data?.success ? profileQuery.data.data : null;

  if (profileQuery.isLoading || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <CircularProgress />
          </Paper>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Settings</Typography>

      <Stack spacing={3}>
        <AccountSection profile={profile} />
        <PasswordSection />
        <InstagramSection initialValue={profile.instagramAccount} />
        <TagDisplaySection profile={profile} />
        <SpotifySection />
        <LegalSection acceptedVersion={profile.acceptedLegalVersion} />
        <DataPrivacySection
          userName={profile.userName}
          onDeleted={() => {
            clearJwt();
            queryClient.clear();
            navigate({ to: ROUTES_PUBLIC.get('LOGIN')! });
          }}
        />
      </Stack>
    </Container>
  );
}


/* --- SECTION: Account --- */

function AccountSection({ profile }: { profile: { userName: string; email: string; lastLoginAt: string | null } }) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const { clearJwt } = useAuthTokenStore();
  const navigate = useNavigate();

  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [requested, setRequested] = useState(false);

  const requestEmailChange = useEndpointMutation(api_UserEmailRequestChange);
  const logout = useEndpointMutation(api_UserLogout);

  /* live re-validation after the first submit attempt -- mirrors the LoginPage pattern */
  const handleEmailChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const next = ev.target.value;
    setNewEmail(next);
    if (triedSubmit || emailError !== '') {
      const r = loginWithEmailSchema.pick({ account: true }).safeParse({ account: next });
      if (!r.success) setEmailError(INVALID_EMAIL_MESSAGE);
      else if (next.trim().toLowerCase() === profile.email.toLowerCase())
        setEmailError('That matches your current email.');
      else setEmailError('');
    }
  };

  const isInputValid = (): boolean => {
    const r = loginWithEmailSchema.pick({ account: true }).safeParse({ account: newEmail });
    if (!r.success) { setEmailError(INVALID_EMAIL_MESSAGE); return false; }
    if (newEmail.trim().toLowerCase() === profile.email.toLowerCase()) {
      setEmailError('That matches your current email.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleRequestEmailChange = async () => {
    setTriedSubmit(true);
    if (!isInputValid()) return;

    const res = await requestEmailChange.mutateAsync({ body: { newEmail: newEmail.trim() } });
    if (res.success) {
      setRequested(true);
      snackbar.success(`Confirmation email sent to ${newEmail.trim()}. Click the link in it to apply the change, then re-login with it.`);
      /* UX continuity: auto-logout in 3s so the user clearly understands they must re-login. */
      setTimeout(async () => {
        try { await logout.mutateAsync({}); } catch { /* ignore */ }
        clearJwt();
        queryClient.clear();
        navigate({ to: ROUTES_PUBLIC.get('LOGIN')! });
      }, 3000);
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message
        : 'Could not send confirmation email.';
      snackbar.error(msg ?? 'Could not send confirmation email.');
    }
  };

  /* "Account deletes on" countdown text. */
  const inactivityNote = profile.lastLoginAt
    ? (() => {
        const last = new Date(profile.lastLoginAt);
        const deleteOn = new Date(last.getTime() + 180 * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.max(0, Math.floor((deleteOn.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        return `Last login: ${last.toLocaleDateString()}. Inactivity-deletion scheduled in ${daysRemaining} days (logging in resets the counter).`;
      })()
    : 'No login recorded yet.';

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Account</Typography>
      <Stack spacing={2}>
        <TextField label="Username (immutable)" size="small" value={profile.userName} disabled fullWidth />
        <TextField label="Current email" size="small" value={profile.email} disabled fullWidth />

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Change email</Typography>
        <Typography variant="caption" color="text.secondary">
          A confirmation email is sent to the new address. Your account email doesn't change until
          you click the link in that email, after which you'll need to log in again.
        </Typography>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {/* EmailField has a built-in "resend confirm" trailing icon - here we repurpose its
              onClick to submit the change request when the email is valid (mirrors the
              ForgotPasswordModal pattern). */}
          <EmailField
            variant="outlined"
            size="small"
            fullWidth
            value={newEmail}
            onChange={handleEmailChange}
            error={!!emailError}
            helperText={emailError || ' '}
            disabled={requested}
            handleConfirmResend={() => { void handleRequestEmailChange(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !requestEmailChange.isPending && !requested) {
                void handleRequestEmailChange();
              }
            }}
          />
          <Button variant="contained" onClick={handleRequestEmailChange}
            disabled={requestEmailChange.isPending || requested}
            startIcon={requestEmailChange.isPending ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap', mt: 0.5 }}
          >
            Send confirmation email
          </Button>
        </Stack>

        <Divider />

        <Typography variant="caption" color="text.secondary">{inactivityNote}</Typography>
      </Stack>
    </Paper>
  );
}


/* --- SECTION: Password ---*/

function PasswordSection() {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const { clearJwt } = useAuthTokenStore();
  const navigate = useNavigate();

  const [cur, setCur] = useState('');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [errN1, setErrN1] = useState('');
  const [errN2, setErrN2] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);

  const change = useEndpointMutation(api_UserPasswordPatch);
  const logout = useEndpointMutation(api_UserLogout);

  /* live re-validate new-password after the first submit attempt */
  const handleN1Change = (ev: ChangeEvent<HTMLInputElement>) => {
    const next = ev.target.value;
    setN1(next);

    if (next === '') {
      setErrN1(EMPTY_PASSWORD_MESSAGE);
    } else if (triedSubmit) {
      const r = loginWithEmailSchema.pick({ password: true }).safeParse({ password: next });
      if (r.success) setErrN1('');
      else {
        let composed = '';
        for (const issue of r.error.issues)
          composed += (composed === '' ? `Missing: ${issue.message}` : `, ${issue.message}`);
        setErrN1(composed);
      }
    } else {
      setErrN1('');
    }

    /* keep repeat in sync if it's already typed */
    if (triedSubmit && n2.length > 0)
      setErrN2(next === n2 ? '' : 'Passwords do not match');
  };

  const handleN2Change = (ev: ChangeEvent<HTMLInputElement>) => {
    const next = ev.target.value;
    setN2(next);
    if (triedSubmit || next.length > 0)
      setErrN2(next === n1 ? '' : 'Passwords do not match');
  };

  const isInputValid = (): boolean => {
    let valid = true;
    if (cur.length === 0) { valid = false; }
    const r = loginWithEmailSchema.pick({ password: true }).safeParse({ password: n1 });
    if (!r.success) {
      let composed = '';
      for (const issue of r.error.issues)
        composed += (composed === '' ? `Missing: ${issue.message}` : `, ${issue.message}`);
      setErrN1(n1 === '' ? EMPTY_PASSWORD_MESSAGE : composed);
      valid = false;
    } else {
      setErrN1('');
    }
    if (n1 !== n2) {
      setErrN2('Passwords do not match');
      valid = false;
    } else {
      setErrN2('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    setTriedSubmit(true);
    if (!isInputValid()) return;

    const res = await change.mutateAsync({ body: { currentPassword: cur, newPassword: n1 } });
    if (res.success) {
      snackbar.success('Password updated. You will be logged out -- please log in with the new password.');
      setTimeout(async () => {
        try { await logout.mutateAsync({}); } catch { /* ignore */ }
        clearJwt();
        queryClient.clear();
        navigate({ to: ROUTES_PUBLIC.get('LOGIN')! });
      }, 3000);
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message
        : 'Could not update password.';
      snackbar.error(msg ?? 'Could not update password.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Password</Typography>
      <Stack spacing={2}>
        <TextField label="Current password" type="password" size="small" fullWidth
          value={cur} onChange={(e) => setCur(e.target.value)}
          slotProps={{ input: { name: 'account-password-current', autoComplete: 'one-time-code' } }}
        />
        <PasswordField
          variant="outlined"
          size="small"
          fullWidth
          value={n1}
          onChange={handleN1Change}
          error={!!errN1}
          helperText={errN1 || 'Choose a strong password'}
        />
        <TextField label="Repeat new password" type="password" size="small" fullWidth
          value={n2}
          onChange={handleN2Change}
          error={!!errN2}
          helperText={errN2 || ''}
          slotProps={{ input: { name: 'account-password-repeat', autoComplete: 'one-time-code' } }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !change.isPending) void handleSubmit(); }}
        />
        <Box>
          <Button variant="contained" onClick={handleSubmit}
            disabled={change.isPending}
            startIcon={change.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveRoundedIcon />}
            sx={{ textTransform: 'none' }}
          >
            Change password
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}


/* --- SECTION: Instagram --- */

function InstagramSection({ initialValue }: { initialValue: string | null }) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const [val, setVal] = useState(initialValue ?? '');
  const update = useEndpointMutation(api_UserInstagramPatch);

  useEffect(() => { setVal(initialValue ?? ''); }, [initialValue]);

  const dirty = (val.trim() || null) !== (initialValue ?? null);

  const handleSave = async () => {
    const res = await update.mutateAsync({
      body: { instagramAccount: val.trim() || null },
    });
    if (res.success) {
      snackbar.success('Instagram handle saved.');
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    } else {
      snackbar.error('Failed to update Instagram handle.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Instagram</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Optional. Shown to members of groups you belong to, so they can message you outside the app.
      </Typography>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField label="Instagram handle" size="small" fullWidth
          placeholder="yourhandle"
          value={val} onChange={(e) => setVal(e.target.value)}
          inputProps={{ maxLength: 30 }}
        />
        <Button variant="contained" onClick={handleSave}
          disabled={!dirty || update.isPending}
          startIcon={update.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveRoundedIcon />}
          sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
        >
          Save
        </Button>
      </Stack>
    </Paper>
  );
}


/* --- SECTION: Tag display --- */

function TagDisplaySection({ profile }: { profile: UserProfile }) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();

  const tagsQuery = useEndpointQuery(['tags'], api_TagsGetAll, undefined, { staleTime: Infinity });
  const tagHierarchy: TagCategoryList | null =
    tagsQuery.data && tagsQuery.data.success ? (tagsQuery.data.data ?? null) : null;

  const update = useEndpointMutation(api_UserDisplayedTagGroupsPatch);

  /* Local working copy of the selection (ordered). Initialised from the profile. */
  const [selected, setSelected] = useState<string[]>(profile.displayedTagGroupIds);
  useEffect(() => { setSelected(profile.displayedTagGroupIds); }, [profile.displayedTagGroupIds]);

  const dirty = useMemo(() => {
    if (selected.length !== profile.displayedTagGroupIds.length) return true;
    for (let i = 0; i < selected.length; i++)
      if (selected[i] !== profile.displayedTagGroupIds[i]) return true;
    return false;
  }, [selected, profile.displayedTagGroupIds]);

  const handleToggle = (groupId: string) => {
    setSelected((prev) => {
      const ix = prev.indexOf(groupId);
      if (ix >= 0) {
        const next = [...prev];
        next.splice(ix, 1);
        return next;
      }
      if (prev.length >= 5) {
        snackbar.warning('At most 5 tag groups can be displayed. Remove one first.');
        return prev;
      }
      return [...prev, groupId];
    });
  };

  const handleSave = async () => {
    const res = await update.mutateAsync({ body: { tagGroupIds: selected } });
    if (res.success) {
      snackbar.success('Tag-display preference saved.');
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message
        : 'Could not save tag-display preference.';
      snackbar.error(msg ?? 'Could not save tag-display preference.');
    }
  };

  const handleResetToDefaults = async () => {
    /* Save an empty list -- the FE then falls through to DEFAULT_DISPLAYED_TAG_GROUP_IDS in
       TagChipStrip.tsx (currently ['ENRGY', 'SVOPR', 'SVIEM']). */
    setSelected([]);
    const res = await update.mutateAsync({ body: { tagGroupIds: [] } });
    if (res.success) {
      snackbar.success('Reset to defaults.');
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    } else {
      snackbar.error('Could not reset to defaults.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Tag display on song cards</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Pick up to 5 tag groups -- they're rendered as chips at the bottom of every song card,
        in the order you select them. Leave empty to use the app defaults.
      </Typography>

      {tagsQuery.isLoading && (
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!tagsQuery.isLoading && !tagHierarchy && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load the tag hierarchy.
        </Alert>
      )}

      {tagHierarchy && (
        <Stack spacing={2.5}>
          <Typography variant="caption" color="text.secondary">
            <b>{selected.length}</b> / 5 selected
          </Typography>

          {tagHierarchy.map((cat) => (
            <Box key={cat.id}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {cat.name}
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                {cat.tagGroups.map((g) => {
                  const order = selected.indexOf(g.id);
                  const isSelected = order >= 0;
                  const Icon = getCategoryIconByGroupOrTagId(g.id);
                  return (
                    <Tooltip key={g.id} arrow disableInteractive
                      title={isSelected
                        ? `Position ${order + 1} -- click to remove`
                        : (selected.length >= 5 ? 'Limit reached (5)' : 'Click to add')}>
                      <Chip
                        icon={<Icon fontSize="small" />}
                        label={isSelected ? `${order + 1}. ${g.name}` : g.name}
                        clickable
                        onClick={() => handleToggle(g.id)}
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : 'default'}
                        sx={{
                          fontWeight: isSelected ? 700 : 500,
                          opacity: !isSelected && selected.length >= 5 ? 0.55 : 1,
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          ))}

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button variant="outlined" startIcon={<RestartAltRoundedIcon />}
              onClick={handleResetToDefaults}
              disabled={update.isPending}
              sx={{ textTransform: 'none' }}
            >
              Reset to defaults
            </Button>
            <Button variant="contained" onClick={handleSave}
              disabled={!dirty || update.isPending}
              startIcon={update.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveRoundedIcon />}
              sx={{ textTransform: 'none' }}
            >
              Save preference
            </Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}


/* --- SECTION: Spotify --- */

function SpotifySection() {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Spotify</Typography>
        <SpotifyAttribution variant="inline" />
      </Stack>
      <Typography variant="body2" color="text.secondary" paragraph>
        For full-length playback (with seeking), the browser you use must be logged into a Spotify
        Premium account. Spotify Free accounts get 30-second previews. The app cannot detect your
        account type because authentication happens inside Spotify's iframe, not in our backend.
      </Typography>
      <Button variant="outlined" startIcon={<OpenInNewRoundedIcon />}
        href="https://accounts.spotify.com/login" target="_blank" rel="noopener noreferrer"
        sx={{ textTransform: 'none' }}
      >
        Open Spotify
      </Button>
    </Paper>
  );
}


/* --- SECTION: Legal --- */

function LegalSection({ acceptedVersion }: { acceptedVersion: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Legal</Typography>
      <Stack spacing={1}>
        <Typography variant="body2">
          You have accepted version <b>{acceptedVersion}</b> of the Privacy Notice and Terms of Service.
          The current version is <b>{CURRENT_LEGAL_VERSION}</b>.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Link component={RouterLink} to="/legal/privacy" target="_blank">Privacy Notice</Link>
          <Link component={RouterLink} to="/legal/terms"   target="_blank">Terms of Service</Link>
        </Stack>
      </Stack>
    </Paper>
  );
}


/* --- SECTION: Data & privacy (export + delete account danger zone) --- */

function DataPrivacySection({ userName, onDeleted }: { userName: string; onDeleted: () => void }) {
  const snackbar = useAppSnackbar();
  const exportMut = useEndpointMutation(api_UserDataExport);
  const deleteMut = useEndpointMutation(api_UserDelete);
  const logout = useEndpointMutation(api_UserLogout);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const deleteArmed = deleteConfirm === userName;

  const handleExport = async () => {
    /* The endpoint sets Content-Disposition: attachment, so a normal call returns the
       JSON and we manually trigger the download via a Blob. */
      const res = await exportMut.mutateAsync({});
      if (!res.success) {
        const msg = res.errorBody && 'message' in res.errorBody
          ? (res.errorBody as { message?: string }).message
          : 'Could not export your data.';
        snackbar.error(msg ?? 'Could not export your data.');
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `setusup-export-${userName}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      snackbar.success('Export downloaded.');
  };

  const handleDelete = async () => {
    if (!deleteArmed)
      return;
    /* BE does the heavy work. Here we just clear local state + redirect. */
    const res = await deleteMut.mutateAsync({});
    if (res.success) {
      snackbar.success('Your account has been deleted.');
      onDeleted();
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message
        : 'Failed to delete your account.';
      snackbar.error(msg ?? 'Failed to delete your account.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Data & privacy</Typography>

      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Export my data</Typography>
            <Typography variant="caption" color="text.secondary">
              Download a JSON file with all data we hold about you (GDPR Art. 15 / 20). Available once every 24 hours.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={handleExport}
            disabled={exportMut.isPending}
            startIcon={exportMut.isPending ? <CircularProgress size={14} color="inherit" /> : <DownloadRoundedIcon />}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Download
          </Button>
        </Stack>

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
            Danger zone
          </Typography>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Deleting your account removes you, your songs, and your playlists from every group
            permanently. <b>This may disrupt playlists other members have built on top of your
            content.</b> This cannot be undone.
          </Alert>
          <TextField label={`Type "${userName}" to confirm`} size="small" fullWidth
            value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button variant="outlined" color="error" onClick={handleDelete} disabled={!deleteArmed || deleteMut.isPending}
              startIcon={deleteMut.isPending ? <CircularProgress size={14} color="inherit" /> : <DeleteForeverRoundedIcon />}
              sx={{ textTransform: 'none' }}
            >
              Delete my account
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Button variant="text" startIcon={<LogoutRoundedIcon />}
            onClick={async () => { try { await logout.mutateAsync({}); } catch {} }}
            sx={{ textTransform: 'none' }}
          >
            Sign out
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
