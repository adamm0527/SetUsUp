using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

// Complete snapshot of all the Tags the modified Song should have.
public sealed record UpsertSongTagsDto
{
    [Required]
    public required List<string> TagIds { get; init; } // if empty: "un-tag everything"
}
