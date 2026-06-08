using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdateSongDto
{
    public string? Artist { get; set; }
    
    public string? Title { get; set; }
    
    public string? Duration { get; set; }
    
    [Range(0, 300)]
    
    public decimal? Bpm { get; set; }
    
    [Range(0, 300)]
    
    public decimal? BpmOut { get; set; }
    
    public string? InitKey { get; set; }

    /* Special semantics for this field:
        null  -- do not touch the existing SongSpotifyLink
        ""    -- unlink (remove the SongSpotifyLink, if it exists)
        "ID"  -- (re-)link to this ID */
    public string? SpotifySongId { get; set; }
}
