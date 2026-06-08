using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Application.AppEntityInterfaces;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("TagCategories")]
public sealed class TagCategoryData : ITagCategory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column(TypeName = "varchar(3)")]
    public required string Id { get; set; } // the 3-char code, PK (no Guid base class used here)

    [Required]
    [Column(TypeName = "nvarchar(64)")]
    public required string Name { get; set; }

#pragma warning disable CS8618 // navigation property
    [InverseProperty(nameof(TagGroupData.Category))]
    public List<TagGroupData> TagGroups { get; set; }
#pragma warning restore CS8618
}
