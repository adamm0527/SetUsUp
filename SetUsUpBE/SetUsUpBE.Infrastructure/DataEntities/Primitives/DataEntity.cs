using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SetUsUpBE.Infrastructure.DataEntities.Primitives;

public abstract class DataEntity
{
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.None)] // Domain Layer creates IDs! (when Entity not yet created)
    [Key, Column("ID", Order = 0)]
    public Guid Id { get; set; } = Guid.NewGuid(); // or Infrastructure Layer (if Entity already persisted)
}
