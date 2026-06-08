using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Infrastructure.DataEntities.Primitives;

namespace SetUsUpBE.Infrastructure.DataEntities;

[Table("Songs")]
public sealed class SongData : DataEntity
{
    [Required]
    [Column(TypeName = "nvarchar(128)")]
    public required string Artist { get; set; }
    
    [Required]
    [Column(TypeName = "nvarchar(128)")]
    public required string Title { get; set; }

    [Required]
    public required TimeOnly Duration { get; set; }

    [Required]
    [Column(TypeName = "decimal(8,4)")]
    public required decimal Bpm { get; set; }

    [Required]
    [Column(TypeName = "decimal(8,4)")]
    public required decimal BpmOut { get; set; }

    [Column(TypeName = "varchar(3)")]
    public string? InitKey { get; set; }


#pragma warning disable CS8618 // Disabling non-nullable prop warning for navigation properties

    [InverseProperty(nameof(PlaylistEntryData.Song))]
    public List<PlaylistEntryData> PlaylistEntries { get; set; } // Navigation property

#pragma warning restore CS8618
}
