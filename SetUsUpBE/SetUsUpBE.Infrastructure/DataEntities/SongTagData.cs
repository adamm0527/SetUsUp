using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SetUsUpBE.Infrastructure.DataEntities;

// Join table: Song <-> Tag assignment
// Composite PK (SongId, TagId) configured in AppDbContext.OnModelCreating.
public sealed class SongTagData
{
#pragma warning disable CS8618 // navigation properties
    [Required]
    [ForeignKey(nameof(Song))]
    public Guid SongId { get; set; }
    public SongData Song { get; set; }

    [Required]
    [ForeignKey(nameof(Tag))]
    [Column(TypeName = "varchar(7)")]
    public string TagId { get; set; }
    public TagData Tag { get; set; }
#pragma warning restore CS8618
}
