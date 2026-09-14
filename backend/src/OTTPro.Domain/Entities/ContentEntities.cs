using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;

namespace OTTPro.Domain.Entities;

public class RatingSummary
{
    [BsonElement("averageRating")]
    public double AverageRating { get; set; } = 0.0;

    [BsonElement("totalRatings")]
    public int TotalRatings { get; set; } = 0;
}

public class StreamingPlatformLink
{
    [BsonElement("platform")]
    public string Platform { get; set; } = string.Empty;

    [BsonElement("deepLink")]
    public string DeepLink { get; set; } = string.Empty;

    [BsonElement("regions")]
    public List<string> Regions { get; set; } = new();
}

public class Show : BaseEntity, IAuditableEntity
{
    [BsonElement("tmdbId")]
    public int? TmdbId { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("originalTitle")]
    public string? OriginalTitle { get; set; }

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("overview")]
    public string Overview { get; set; } = string.Empty;

    [BsonElement("posterPath")]
    public string? PosterPath { get; set; }

    [BsonElement("backdropPath")]
    public string? BackdropPath { get; set; }

    [BsonElement("genres")]
    public List<string> Genres { get; set; } = new();

    [BsonElement("releaseDate")]
    public string? ReleaseDate { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "Released"; // Returning Series, Ended, etc.

    [BsonElement("totalSeasons")]
    public int TotalSeasons { get; set; } = 0;

    [BsonElement("totalEpisodes")]
    public int TotalEpisodes { get; set; } = 0;

    [BsonElement("ratingSummary")]
    public RatingSummary RatingSummary { get; set; } = new();

    [BsonElement("streamingPlatforms")]
    public List<StreamingPlatformLink> StreamingPlatforms { get; set; } = new();

    [BsonElement("trailerUrl")]
    public string? TrailerUrl { get; set; }

    [BsonElement("videoUrl")]
    public string? VideoUrl { get; set; }
}

public class Movie : BaseEntity, IAuditableEntity
{
    [BsonElement("tmdbId")]
    public int? TmdbId { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("overview")]
    public string Overview { get; set; } = string.Empty;

    [BsonElement("runtimeMinutes")]
    public int RuntimeMinutes { get; set; } = 0;

    [BsonElement("posterPath")]
    public string? PosterPath { get; set; }

    [BsonElement("backdropPath")]
    public string? BackdropPath { get; set; }

    [BsonElement("genres")]
    public List<string> Genres { get; set; } = new();

    [BsonElement("releaseDate")]
    public string? ReleaseDate { get; set; }

    [BsonElement("ratingSummary")]
    public RatingSummary RatingSummary { get; set; } = new();

    [BsonElement("streamingPlatforms")]
    public List<StreamingPlatformLink> StreamingPlatforms { get; set; } = new();

    [BsonElement("trailerUrl")]
    public string? TrailerUrl { get; set; }

    [BsonElement("videoUrl")]
    public string? VideoUrl { get; set; }
}

public class Season : BaseEntity
{
    [BsonElement("showId")]
    public string ShowId { get; set; } = string.Empty;

    [BsonElement("seasonNumber")]
    public int SeasonNumber { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("overview")]
    public string? Overview { get; set; }

    [BsonElement("posterPath")]
    public string? PosterPath { get; set; }

    [BsonElement("episodeCount")]
    public int EpisodeCount { get; set; }

    [BsonElement("airDate")]
    public string? AirDate { get; set; }
}

public class Episode : BaseEntity
{
    [BsonElement("showId")]
    public string ShowId { get; set; } = string.Empty;

    [BsonElement("seasonId")]
    public string SeasonId { get; set; } = string.Empty;

    [BsonElement("seasonNumber")]
    public int SeasonNumber { get; set; }

    [BsonElement("episodeNumber")]
    public int EpisodeNumber { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("overview")]
    public string? Overview { get; set; }

    [BsonElement("stillPath")]
    public string? StillPath { get; set; }

    [BsonElement("runtimeMinutes")]
    public int RuntimeMinutes { get; set; }

    [BsonElement("airDate")]
    public string? AirDate { get; set; }

    [BsonElement("ratingSummary")]
    public RatingSummary RatingSummary { get; set; } = new();
}
