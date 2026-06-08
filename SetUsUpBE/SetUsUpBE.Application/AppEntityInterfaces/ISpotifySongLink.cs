namespace SetUsUpBE.Application.AppEntityInterfaces;

// SongId-SpotifySongId pairs, representing linked Songs.
public interface ISpotifySongLink
{
    Guid SongId { get; set; }
    string SpotifySongId { get; set; }
}
