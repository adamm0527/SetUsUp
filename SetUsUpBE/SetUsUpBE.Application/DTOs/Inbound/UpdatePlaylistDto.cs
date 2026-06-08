namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdatePlaylistDto
{
    public string? Name { get; init; }
    public string? Description { get; init; }
}
