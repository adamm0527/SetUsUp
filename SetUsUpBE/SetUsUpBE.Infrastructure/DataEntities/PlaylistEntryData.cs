using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Infrastructure.DataEntities.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("PlaylistEntries")]
public sealed class PlaylistEntryData : DataEntity
{
    [Required]
    public required uint Nr {  get; set; }

    [Required]
    public required TimeOnly Start { get; set; }

    [Required]
    public required TimeOnly End { get; set; }

    [Column(TypeName = "varchar(3)")]
    public string? TransitionToNext { get; set; }

    [Column(TypeName = "varchar(8)")]
    public string? HexColour { get; set; }

    [Column(TypeName = "nvarchar(512)")]
    public string? Comment { get; set; }

    /* When true, this entry is "mixed in" with the previous entry: it shares the same Nr slot
       in the user's playlist (rendered as "w/" in the FE instead of an ordinal). The first
       entry of a playlist can never be WithPrev=true (domain invariant enforced in
       PlaylistEntry.CheckFirstMaster_). Default false for legacy rows. */
    [Required]
    public bool WithPrev { get; set; } = false;

    [Required]
    [Column(TypeName = "decimal(8,4)")] // Matching SongData.Bpm's precision
    public decimal BpmChange { get; set; } = 0;

#pragma warning disable CS8618 // Disabling non-nullable prop warning for navigation properties

    [Required]
    [ForeignKey(nameof(Song))]
    public Guid SongId { get; set; }
    public SongData Song { get; set; } // Navigation property

    [Required]
    [ForeignKey(nameof(Playlist))]
    public Guid PlaylistId { get; set; }
    public PlaylistData Playlist { get; set; } // Navigation property

    [Required]
    [ForeignKey(nameof(CreatorUser))]
    public string CreatorUserId { get; set; }
    public AppIdentityUser CreatorUser { get; set; } // Navigation property

    [InverseProperty(nameof(PlaylistEntryRatingData.PlaylistEntry))]
    public List<PlaylistEntryRatingData> Ratings { get; set; } // Navigation property

#pragma warning restore CS8618
}
