using OTTPro.Domain.Entities;

namespace OTTPro.Application.DTOs.Content;

public class ContentCardDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty; // Show or Movie
    public string Overview { get; set; } = string.Empty;
    public string? PosterPath { get; set; }
    public string? BackdropPath { get; set; }
    public List<string> Genres { get; set; } = new();
    public string? ReleaseDate { get; set; }
    public double AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public List<string> StreamingPlatforms { get; set; } = new();
}

public class ShowDetailsDto : ContentCardDto
{
    public int TotalSeasons { get; set; }
    public int TotalEpisodes { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<StreamingPlatformLink> Platforms { get; set; } = new();
    public List<SeasonDto> Seasons { get; set; } = new();
}

public class MovieDetailsDto : ContentCardDto
{
    public int RuntimeMinutes { get; set; }
    public List<StreamingPlatformLink> Platforms { get; set; } = new();
}

public class SeasonDto
{
    public string Id { get; set; } = string.Empty;
    public string ShowId { get; set; } = string.Empty;
    public int SeasonNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Overview { get; set; }
    public string? PosterPath { get; set; }
    public int EpisodeCount { get; set; }
    public string? AirDate { get; set; }
    public List<EpisodeDto> Episodes { get; set; } = new();
}

public class EpisodeDto
{
    public string Id { get; set; } = string.Empty;
    public string ShowId { get; set; } = string.Empty;
    public string SeasonId { get; set; } = string.Empty;
    public int SeasonNumber { get; set; }
    public int EpisodeNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Overview { get; set; }
    public string? StillPath { get; set; }
    public int RuntimeMinutes { get; set; }
    public string? AirDate { get; set; }
    public double AverageRating { get; set; }
}

public class DiscoveryResponseDto
{
    public List<ContentCardDto> TrendingShows { get; set; } = new();
    public List<ContentCardDto> PopularMovies { get; set; } = new();
    public List<ContentCardDto> TopRated { get; set; } = new();
}
