using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

/* For upserting the calling user's 1..5 star rating for the given PlaylistEntry.
   Idempotent: re-PUT replaces, DELETE removes. */
public sealed record UpsertPlaylistEntryRatingDto
{
    [Required]
    [Range(1, 5)]
    public required int Rating { get; init; }
}
