using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Infrastructure.DataEntities.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("Playlists")]
public sealed class PlaylistData : DataEntity
{
    [Required]
    [Column(TypeName = "nvarchar(64)")]
    public required string Name { get; set; }

    [Column(TypeName = "nvarchar(512)")]
    public string? Description { get; set; }

    [Required]
    public required TimeSpan Duration { get; set; }


#pragma warning disable CS8618 // Disabling non-nullable prop warning for navigation properties

    [Required]
    [ForeignKey(nameof(Group))]
    public Guid GroupId { get; set; }
    
    public GroupData Group { get; set; } // Navigation property

    [Required]
    [ForeignKey(nameof(CreatorUser))]
    public string CreatorUserId { get; set; }
    public AppIdentityUser CreatorUser { get; set; } // Navigation property

    [InverseProperty(nameof(PlaylistEntryData.Playlist))]
    public List<PlaylistEntryData> Entries { get; set; } // Navigation property

#pragma warning restore CS8618
}
