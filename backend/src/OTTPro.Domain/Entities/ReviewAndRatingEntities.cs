using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;
using OTTPro.Domain.Enums;

namespace OTTPro.Domain.Entities;

public class Rating : BaseEntity, IAuditableEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("mediaType")]
    public MediaType MediaType { get; set; }

    [BsonElement("mediaId")]
    public string MediaId { get; set; } = string.Empty;

    [BsonElement("score")]
    public double Score { get; set; } // 0.5 to 10.0
}

public class Review : BaseEntity, IAuditableEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("authorUsername")]
    public string AuthorUsername { get; set; } = string.Empty;

    [BsonElement("authorAvatar")]
    public string? AuthorAvatar { get; set; }

    [BsonElement("mediaType")]
    public MediaType MediaType { get; set; }

    [BsonElement("mediaId")]
    public string MediaId { get; set; } = string.Empty;

    [BsonElement("ratingScore")]
    public double RatingScore { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("containsSpoilers")]
    public bool ContainsSpoilers { get; set; } = false;

    [BsonElement("upvoteCount")]
    public int UpvoteCount { get; set; } = 0;

    [BsonElement("downvoteCount")]
    public int DownvoteCount { get; set; } = 0;

    [BsonElement("commentCount")]
    public int CommentCount { get; set; } = 0;

    [BsonElement("isEdited")]
    public bool IsEdited { get; set; } = false;
}
