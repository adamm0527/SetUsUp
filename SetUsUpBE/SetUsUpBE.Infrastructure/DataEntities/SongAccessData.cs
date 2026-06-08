using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Infrastructure.DataEntities.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("SongAccess")]
public sealed class SongAccessData : DataEntity, ISongAccess
{
#pragma warning disable CS8618 // Disabling non-nullable prop warning for navigation properties

    [Required]
    [ForeignKey(nameof(CreatorUser))]
    public string CreatorUserId { get; set; }
    public AppIdentityUser CreatorUser { get; set; } // Navigation property

    [Required]
    [ForeignKey(nameof(Song))]
    public Guid SongId { get; set; }
    public SongData Song { get; set; } // Navigation property

    [Required]
    [ForeignKey(nameof(Group))]
    public Guid GroupId { get; set; }
    public GroupData Group { get; set; } // Navigation property

#pragma warning restore CS8618
}
