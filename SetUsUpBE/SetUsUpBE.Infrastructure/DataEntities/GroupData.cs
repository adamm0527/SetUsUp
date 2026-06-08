using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Infrastructure.DataEntities.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("TagGroups")]
public sealed class GroupData : DataEntity
{
    [Required]
    [Column(TypeName = "nvarchar(64)")]
    public required string Name { get; set; }

    [Required]
    [Column(TypeName = "bit")]
    public required bool IsUserCreated { get; set; }


#pragma warning disable CS8618 // Disabling non-nullable prop warning for navigation properties

    [Required]
    [ForeignKey(nameof(CreatorUser))]
    public string CreatorUserId { get; set; }
    public AppIdentityUser CreatorUser { get; set; } // Navigation property

    [InverseProperty(nameof(PlaylistData.Group))]
    public List<PlaylistData> Playlists { get; set; } // Navigation property

#pragma warning restore CS8618
}
