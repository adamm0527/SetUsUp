using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Application.AppEntityInterfaces;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("SongSpotifyLinks")]
public sealed class SongSpotifyLinkData : ISpotifySongLink
{
#pragma warning disable CS8618 // navigation property
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [ForeignKey(nameof(Song))]
    public Guid SongId { get; set; } // both PK and FK (absence of a row means "not linked")
    public SongData Song { get; set; }
#pragma warning restore CS8618

    [Required]
    [Column(TypeName = "nvarchar(64)")]
    public required string SpotifySongId { get; set; }

    [Column(TypeName = "nvarchar(2048)")]
    public string? CachedCoverUrl { get; set; } // public Spotify CDN path (no privacy concern)

    // timestamp of last WRITE, used to determine if caching is fresh (<180 days)
    public DateTime? CachedCoverAt { get; set; }
}
