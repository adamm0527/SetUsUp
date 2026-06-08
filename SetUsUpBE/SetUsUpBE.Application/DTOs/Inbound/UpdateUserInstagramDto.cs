namespace SetUsUpBE.Application.DTOs.Inbound;

/* Update the user's Instagram handle. Null/empty string clears it. No format validation -- the
   FE renders the value as `instagram.com/{handle}` and broken handles just 404 on Instagram. */
public sealed record UpdateUserInstagramDto
{
    public string? InstagramAccount { get; init; }
}
