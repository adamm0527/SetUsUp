using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

/* Replaces the user's ordered preference of TagGroup IDs to render as chips on the bottom of SongCards.
   Pass an empty list to clear the preference (FE reverts to default preference). */
public sealed record UpdateUserDisplayedTagGroupsDto
{
    [Required]
    [MaxLength(5)]
    public required List<string> TagGroupIds { get; init; } // item example: 'ENRGY'
}
