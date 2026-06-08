using SetUsUpBE.Application.AppEntityInterfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("Tags")]
public sealed class TagData : ITag
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column(TypeName = "varchar(7)")]
    public required string Id { get; set; } // the 7-char code, PK (no Guid base class used here)

    [Required]
    [Column(TypeName = "nvarchar(64)")]
    public required string Name { get; set; }

    [Required]
    [Column(TypeName = "nvarchar(512)")]
    public required string Description { get; set; }

#pragma warning disable CS8618 // navigation property
    [Required]
    [ForeignKey(nameof(TagGroup))]
    [Column(TypeName = "varchar(5)")]
    public required string TagGroupId { get; set; }
    public TagGroupData TagGroup { get; set; }
#pragma warning restore CS8618
}
