using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Infrastructure.DataEntities.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("GroupMemberships")]
public sealed class GroupMembershipData : DataEntity, IGroupMembership
{
    [Required]
    [Column(TypeName = "bit")]
    public required bool IsAdmin { get; set; }

#pragma warning disable CS8618 // Disabling non-nullable prop warning for navigation properties

    [Required]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; }
    public AppIdentityUser User { get; set; } // Navigation property

    [Required]
    [ForeignKey(nameof(Group))]
    public Guid GroupId { get; set; }
    public GroupData Group { get; set; } // Navigation property

#pragma warning restore CS8618
}
