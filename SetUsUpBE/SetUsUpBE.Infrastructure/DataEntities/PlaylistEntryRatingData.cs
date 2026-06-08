using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Infrastructure.DataEntities.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("PlaylistEntryRatings")]
public sealed class PlaylistEntryRatingData : DataEntity, IPlaylistEntryRating
{
#pragma warning disable CS8618 // Disabling non-nullable prop warning for navigation properties

    [Required]
    [ForeignKey(nameof(RaterUser))]
    public string RaterUserId { get; set; }   
    public AppIdentityUser RaterUser { get; set; } // Navigation property

    [Required]
    [ForeignKey(nameof(PlaylistEntry))]
    public Guid PlaylistEntryId { get; set; }
    public PlaylistEntryData PlaylistEntry { get; set; } // Navigation property

#pragma warning restore CS8618

    [Required]
    public required Rating Rating { get; set; }
}
