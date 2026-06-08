using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Infrastructure.Configuration;

public sealed class SpotifyConfiguration
{
    public const string SectionName = "Spotify";

    [Required(AllowEmptyStrings = false)]
    public string ClientId { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string ClientSecret { get; set; } = string.Empty;

    // RapidAPI "track-analysis" augmentation, for BPM + Camelot key in lookups
    // (as Spotify's own audio-features endpoint is no longer accessible to new Dev apps).
    public string RapidApiKey { get; set; } = string.Empty;
    public string RapidApiHost { get; set; } = "track-analysis.p.rapidapi.com";
}
