import { Container, Paper, Typography, Box, Divider, Stack, Link } from '@mui/material';
import { CURRENT_LEGAL_VERSION } from '#root/lib/legal/constants';


/* The Privacy Notice. Plain React + MUI.
   BUMP CURRENT_LEGAL_VERSION (both FE and BE constants) ANYTIME the body of this page changes,
   so existing users are forced to re-acknowledge on next login. */
export default function PrivacyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Privacy Notice
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Version {CURRENT_LEGAL_VERSION} — effective 2026-05-17
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>

          <Section heading="1. Who operates this service">
            <Typography gutterBottom>
              This is a personal, non-commercial application created and operated by <i>Mizser Ádám Zoltán</i>,
              a data controller established in the European Union, for use by a small group of DJs
              to organise music metadata. The service is not monetised, contains no advertising,
              and is not in competition with Spotify or any commercial music-streaming service —
              it serves a distinct hobby domain (DJ preparation).
            </Typography>
            <Typography gutterBottom>
              <b>Contact:</b>{' '}
              <Link href="mailto:dev.setusup@gmail.com" target="_blank" rel="noopener noreferrer">
                dev.setusup@gmail.com
              </Link>              
            </Typography>
            <Typography gutterBottom>
              This notice describes how personal data is processed under{' '}
              <b>Regulation (EU) 2016/679 ("GDPR")</b> and{' '}
              <b>Hungarian Act CXII of 2011</b> on Informational Self-Determination
              and Freedom of Information.
            </Typography>
          </Section>

          <Section heading="2. What we process and why">
            <DataTable rows={[
              ['Username, email, hashed password', 'Account, authentication, recovery', 'Art. 6(1)(b) performance of contract'],
              ['Last login timestamp', 'Detecting inactivity for retention enforcement', 'Art. 6(1)(c) legal obligation (Art. 5(1)(e) storage limitation)'],
              ['Group memberships and roles', 'Enabling collaboration', 'Art. 6(1)(b)'],
              ['Songs, playlists, tags, optional Spotify reference', "The app's primary purpose", 'Art. 6(1)(b)'],
              ['Optional Instagram handle', 'Voluntarily shared with co-members for messaging outside the app', 'Art. 6(1)(a) explicit consent'],
              ['JWT in browser localStorage', 'Authenticated session', 'Art. 6(1)(b)'],
            ]} />
            <Typography gutterBottom sx={{ mt: 2 }}>
              We do <b>not</b> collect: location data, device fingerprints, analytics, cookies
              (beyond the JWT), or any data outside this list. We do not process special
              categories of data under Art. 9.
            </Typography>
          </Section>

          <Section heading="3. Retention">
            <Typography component="ul" sx={{ pl: 3 }}>
              <li><b>Inactive accounts</b> are deleted after <b>180 days</b> without login.
                Warning emails are sent at 30, 7, 3, 2 and 1 days before deletion. Logging in
                resets the counter. This implements the storage-limitation principle (Art. 5(1)(e)).</li>
              <li><b>Self-deletion</b> (Art. 17): immediate hard-delete. Songs and playlists you
                authored are cascade-removed from groups they were shared with. Comments you wrote
                on others' content remain (they are stored as an anonymous shared field).</li>
              <li><b>JWT revocation list</b>: in-memory only; cleared on every backend restart.</li>
              <li><b>Email transmission logs</b>: not retained.</li>
            </Typography>
          </Section>

          <Section heading="4. Your rights">
            <Typography component="ul" sx={{ pl: 3 }}>
              <li><b>Art. 15 (Access) / Art. 20 (Portability)</b>: download a complete JSON export
                of your data from your settings page. Limited to once per 24 hours under Art. 12(5).</li>
              <li><b>Art. 16 (Rectification)</b>: edit your email, password and Instagram handle
                from your settings page.</li>
              <li><b>Art. 17 (Erasure)</b>: delete your account from your settings page (the
                effect is immediate).</li>
              <li><b>Art. 18 (Restriction)</b> and <b>Art. 21 (Objection)</b>: contact us at the
                address above.</li>
              <li><b>Art. 22</b>: no automated decision-making is performed.</li>
              <li><b>Art. 77 (Right to complain)</b>: you may complain to the Hungarian Data
                Protection Authority (<i>Nemzeti Adatvédelmi és Információszabadság Hatóság — NAIH</i>,
                www.naih.hu).</li>
            </Typography>
          </Section>

          <Section heading="5. Third-party processors">
            <DataTable rows={[
              ['Spotify AB', 'Spotify track IDs the user chooses to link',
                'Metadata lookup, cover image rendering, audio playback via the official Spotify Embed iframe. The iframe authenticates against the user\'s own Spotify session in their browser — we transmit no user identifier to Spotify (metadata requests use only our application credentials).'],
              ['[SMTP provider: smtp.gmail.com]', 'User email address, transactional email content',
                'Account confirmation, password resets, inactivity warnings, email-change confirmations.'],
              ['GetSongBPM (planned, post-deployment)', 'Song title and artist string',
                'BPM/key lookup for the Music Library.'],
            ]} />
            <Typography gutterBottom sx={{ mt: 2 }}>
              Spotify's processing of its own data is governed by{' '}
              <Link href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
                Spotify's privacy policy
              </Link>
            </Typography>
          </Section>

          <Section heading="6. Security">
            <Typography component="ul" sx={{ pl: 3 }}>
              <li>Passwords are hashed via ASP.NET Identity's default scheme (PBKDF2-HMAC-SHA256,
                ≥10 000 iterations, per-user salt).</li>
              <li>Authentication uses 4-hour JWT bearer tokens rotated on activity, revoked on
                logout, and invalidated on password/email change via SecurityStamp rotation. All
                sessions are also invalidated on backend restart.</li>
              <li>The JWT is stored in browser <code>localStorage</code>. This choice gives the
                single-page-application architecture structural CSRF immunity at the cost of XSS
                exposure. We use a strict Content-Security-Policy to mitigate the latter. We disclose this
                trade-off so you can make an informed choice.</li>
              <li>In production, all traffic is served over HTTPS.</li>
            </Typography>
          </Section>

          <Section heading="7. Territorial scope">
            <Typography gutterBottom>
              The service is operated from the European Union and processes personal data in
              accordance with the GDPR. The service is not actively offered outside the EU/EEA.
              Users from other jurisdictions may have additional rights under their local
              data-protection laws; reasonable requests on those grounds will be honoured where
              applicable.
            </Typography>
          </Section>

          <Section heading="8. Changes">
            <Typography gutterBottom>
              This notice may be updated. When it is, the version number above is incremented
              and you will be asked to re-acknowledge it on your next login.
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

function DataTable({ rows }: { rows: string[][] }) {
  return (
    <Box component="table" sx={{
      width: '100%', borderCollapse: 'collapse', mt: 1,
      '& td, & th': { border: 1, borderColor: 'divider', p: 1, verticalAlign: 'top',
        fontSize: '0.875rem', textAlign: 'left' },
      '& th': { backgroundColor: 'action.hover', fontWeight: 700 },
    }}>
      <thead>
        <tr><th>Data</th><th>Purpose</th><th>Lawful basis (GDPR Art. 6)</th></tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </Box>
  );
}
