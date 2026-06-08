using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

/* For submitting a COMPLETE new ordering of the user's currently-selected playlist's entries.
   Used when moving together more than 1 entries (moving a "master" entry with its WithPrev=true "children").
   This is to make it atomic. Domain AggregateRoot will still validate, so no invalid DTO can mess with consistency. */
public sealed record UpdatePlaylistEntryPositionInBulkDto
{
    /* The full ordered list of entry IDs in the playlist's new order. Position 0 = first entry. */
    [Required]
    [MinLength(1)]
    public required List<Guid> OrderedEntryIds { get; init; }
}
