namespace SetUsUpBE.Application.Services.Primitives;

/* Source of truth for the versions of the legal acknowledgements the User must make before using the App (or some of it's features).
   Bump these values whenever the corresponding document changes, in which case on the next login the user will
   be presented with a forced re-acceptance modal until they tick "I accept" and the BE upserts
   their AcceptedLegalVersion / AcceptedSpotifyNoticeVersion to the new value on their persisted User entity. */
public static class LegalConstants
{
    /* Privacy Notice + Terms of Service. They are versioned together because both are presented
       at registration in a single acceptance gate. */
    public const int CURRENT_LEGAL_VERSION = 1;

    /* The Spotify auto-fill notice (about metadata snapshotting + auto-unlink behaviour). */
    public const int CURRENT_SPOTIFY_NOTICE_VERSION = 1;
}
