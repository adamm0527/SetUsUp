import { Container, Paper, Typography, Box, Divider, Stack, Link } from '@mui/material';
import { CURRENT_LEGAL_VERSION } from '#root/lib/legal/constants';


/* Terms of Service. Plain React + MUI.
   BUMP CURRENT_LEGAL_VERSION (both FE and BE constants) ANYTIME the body of this page changes,
   so existing users are forced to re-acknowledge on next login. */
export default function TermsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Terms of Service
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Version {CURRENT_LEGAL_VERSION} — effective 2026-05-17
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>

          <Section heading="1. About this service">
            <Typography gutterBottom>
              This is a personal, non-commercial application for organising DJ-relevant music
              metadata, operated by <i>Mizser Ádám Zoltán</i> in the European Union as a closed hobby
              project. It has no commercial purpose and is not in competition with Spotify or any
              commercial music-streaming service — it serves a distinct domain (DJ preparation) by
              referencing tracks the user already accesses on Spotify.
            </Typography>
          </Section>

          <Section heading="2. Account">
            <Typography gutterBottom>
              You must provide a working email address to register. You are responsible for
              keeping your credentials confidential. Passwords are not stored in plaintext and
              cannot be recovered. In case you forget your password, the forgot-password flow lets you reset.
            </Typography>
            <Typography gutterBottom>
              <b>Usernames are immutable</b> once created. Email and password may be changed from
              your settings page.
            </Typography>
          </Section>

          <Section heading="3. Acceptable use">
            <Typography gutterBottom>
              You may use the service to organise music and playlists you have legitimate access
              to, and to share them with members of groups you create or join.
            </Typography>
            <Typography gutterBottom>
              You may <b>not</b>: attempt to access other users' accounts without authorisation;
              use the service to host, distribute, or stream copyrighted audio (the service hosts
              no audio — playback is exclusively via Spotify's official Embed iframe); use the
              service for commercial purposes; use the service to harass other members.
            </Typography>
          </Section>

          <Section heading="4. Your content">
            <Typography gutterBottom>
              You retain all rights to the metadata you contribute (song annotations, tags,
              comments). By sharing content with a group, you grant other members of that group a
              non-exclusive licence to view and reference it within the service for as long as the
              content remains in the group.
            </Typography>
          </Section>

          <Section heading="5. Spotify integration">
            <Typography gutterBottom>
              The service uses the Spotify Web API for metadata lookup and the Spotify Embed
              iframe for playback. Metadata fetched via auto-fill is captured once and stored
              thereafter as your own user-contributed content; the service does not keep this data
              synchronised with Spotify. If Spotify later removes or alters a linked track, the
              service automatically unlinks the Spotify reference (cover, embed) on next access;
              your other fields remain intact.
            </Typography>
            <Typography gutterBottom>
              Playback occurs entirely through Spotify's player under your own Spotify account.
              The service has no access to your Spotify credentials and does not link your Spotify
              account to your account in this service.
            </Typography>
          </Section>

          <Section heading="6. Group collaboration">
            <Typography gutterBottom>
              Songs and playlists shared with a group are visible to every member of that group.
              <b> If you delete your account, songs and playlists you authored are cascade-removed
              from every group they were shared with; this may disrupt playlists other members
              have built on top of yours.</b> A confirmation warning is shown when you initiate
              account deletion.
            </Typography>
          </Section>

          <Section heading="7. Retention and account deletion">
            <Typography gutterBottom>
              If you do not log in for <b>180 days</b>, your account is automatically deleted.
              Warning emails are sent at 30, 7, 3, 2 and 1 days before the deletion date; logging
              in resets the counter. You may delete your account at any time from your settings
              page.
            </Typography>
          </Section>

          <Section heading="8. Service availability">
            <Typography gutterBottom>
              This is a hobby project with no service-level commitment. The service may be
              unavailable for maintenance, deployment, or hosting issues without notice. No
              refunds are offered (the service is free).
            </Typography>
          </Section>

          <Section heading="9. Disclaimer and limitation of liability">
            <Typography gutterBottom>
              The service is provided <b>"as is"</b> without warranty of any kind. To the extent
              permitted by EU and Hungarian law, the controller's aggregate liability for any
              claim relating to the service is limited to direct damages and shall not exceed
              <b> EUR 1</b>.
            </Typography>
            <Typography gutterBottom>
              The service does not warrant the accuracy of metadata sourced from third-party
              providers (Spotify, GetSongBPM and any future provider listed in the Privacy Notice).
            </Typography>
          </Section>

          <Section heading="10. Changes">
            <Typography gutterBottom>
              These terms may be updated. When they are, the version number above is incremented
              and you will be asked to re-acknowledge them on your next login.
            </Typography>
          </Section>

          <Section heading="11. Governing law and disputes">
            <Typography gutterBottom>
              These terms are governed by Hungarian law. Disputes that cannot be resolved
              amicably shall be brought before the Hungarian courts having jurisdiction at the
              controller's place of residence.
            </Typography>
          </Section>

          <Section heading="12. Contact">
            <Typography gutterBottom>
              <Link href="mailto:dev.setusup@gmail.com" target="_blank" rel="noopener noreferrer">
                dev.setusup@gmail.com
              </Link>
            </Typography>
          </Section>

        </Stack>
      </Paper>
    </Container>
  );
}


function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{heading}</Typography>
      {children}
    </Box>
  );
}
