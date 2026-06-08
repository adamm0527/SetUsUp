namespace SetUsUpBE.Application.AppEntityInterfaces;

public enum Rating
{
    Star1 = 1,
    Star2 = 2,
    Star3 = 3,
    Star4 = 4,
    Star5 = 5
}

public interface IPlaylistEntryRating
{
    string RaterUserId { get; set; }
    Guid PlaylistEntryId { get; set; }
    Rating Rating { get; set; }
}
