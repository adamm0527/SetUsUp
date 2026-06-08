namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdatePlaylistEntryDto
{
    public string? StartTime { get; init; }

    public string? EndTime { get; init; }

    public string? Comment { get; init; }

    public string? HexColour { get; init; }

    /* When set, toggles the "play with previous entry" flag on this entry.
       The domain layer enforces that the first entry of a playlist cannot have WithPrev=true. */
    public bool? WithPrev { get; init; }

    /* Signed BPM delta applied on top of the source song's BPM.
       Positive = faster playback (duration decrease), negative = slower (duration increase).
       Domain validates the resulting effective BPM stays inside (0,300).
       Setting 0 (or null) means "no change" (referenced Song's original BPM). */
    public decimal? BpmChange { get; init; }
}
