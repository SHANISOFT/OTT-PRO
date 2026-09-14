using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;
using OTTPro.Domain.Enums;

namespace OTTPro.Domain.Entities;

public class WatchlistItem : BaseEntity, IAuditableEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("mediaType")]
    public MediaType MediaType { get; set; }

    [BsonElement("mediaId")]
    public string MediaId { get; set; } = string.Empty;

    [BsonElement("status")]
    public WatchStatus Status { get; set; } = WatchStatus.PlanToWatch;

    [BsonElement("priority")]
    public int Priority { get; set; } = 1;

    [BsonElement("tags")]
    public List<string> Tags { get; set; } = new();
}

public class WatchingProgress : BaseEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("showId")]
    public string ShowId { get; set; } = string.Empty;

    [BsonElement("lastWatchedSeason")]
    public int LastWatchedSeason { get; set; } = 1;

    [BsonElement("lastWatchedEpisode")]
    public int LastWatchedEpisode { get; set; } = 1;

    [BsonElement("lastWatchedEpisodeId")]
    public string? LastWatchedEpisodeId { get; set; }

    [BsonElement("completedEpisodeIds")]
    public List<string> CompletedEpisodeIds { get; set; } = new();

    [BsonElement("isCompleted")]
    public bool IsCompleted { get; set; } = false;

    [BsonElement("lastWatchedAt")]
    public DateTime LastWatchedAt { get; set; } = DateTime.UtcNow;
}
