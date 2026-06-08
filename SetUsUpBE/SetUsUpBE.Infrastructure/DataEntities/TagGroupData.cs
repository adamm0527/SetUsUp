using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Application.AppEntityInterfaces;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("TagGroups")]
public sealed class TagGroupData : ITagGroup
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column(TypeName = "varchar(5)")]
    public required string Id { get; set; } // the 5-char code, PK (no Guid base class used here)

    [Required]
    [Column(TypeName = "nvarchar(128)")]
    public required string Name { get; set; }

    [Required]
    public required TagGroupType Type { get; set; }

#pragma warning disable CS8618 // navigation properties
    [Required]
    [ForeignKey(nameof(Category))]
    [Column(TypeName = "varchar(3)")]
    public required string CategoryId { get; set; }
    public TagCategoryData Category { get; set; }

    [InverseProperty(nameof(TagData.TagGroup))]
    public List<TagData> Tags { get; set; }
#pragma warning restore CS8618
}
