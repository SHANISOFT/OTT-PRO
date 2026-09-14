using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;
using OTTPro.Domain.Enums;

namespace OTTPro.Domain.Entities;

public class TaggedMediaInfo
{
    [BsonElement("mediaType")]
    public MediaType MediaType { get; set; }

    [BsonElement("mediaId")]
    public string MediaId { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("seasonNumber")]
    public int? SeasonNumber { get; set; }

    [BsonElement("episodeNumber")]
    public int? EpisodeNumber { get; set; }
}

public class AuthorSnapshot
{
    [BsonElement("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("avatarUrl")]
    public string? AvatarUrl { get; set; }
}

public class Post : BaseEntity, IAuditableEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("author")]
    public AuthorSnapshot Author { get; set; } = new();

    [BsonElement("postType")]
    public PostType PostType { get; set; } = PostType.Text;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("mediaUrls")]
    public List<string> MediaUrls { get; set; } = new();

    [BsonElement("taggedMedia")]
    public TaggedMediaInfo? TaggedMedia { get; set; }

    [BsonElement("containsSpoilers")]
    public bool ContainsSpoilers { get; set; } = false;

    [BsonElement("likeCount")]
    public int LikeCount { get; set; } = 0;

    [BsonElement("commentCount")]
    public int CommentCount { get; set; } = 0;

    [BsonElement("shareCount")]
    public int ShareCount { get; set; } = 0;

    [BsonElement("status")]
    public string Status { get; set; } = "Published"; // Published, UnderReview, Removed
}

public class Comment : BaseEntity
{
    [BsonElement("targetType")]
    public string TargetType { get; set; } = "Post"; // Post, Review, Discussion

    [BsonElement("targetId")]
    public string TargetId { get; set; } = string.Empty;

    [BsonElement("parentCommentId")]
    public string? ParentCommentId { get; set; }

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("author")]
    public AuthorSnapshot Author { get; set; } = new();

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("likeCount")]
    public int LikeCount { get; set; } = 0;

    [BsonElement("replyCount")]
    public int ReplyCount { get; set; } = 0;

    [BsonElement("containsSpoilers")]
    public bool ContainsSpoilers { get; set; } = false;
}

public class Follow : BaseEntity
{
    [BsonElement("followerId")]
    public string FollowerId { get; set; } = string.Empty;

    [BsonElement("followeeId")]
    public string FolloweeId { get; set; } = string.Empty;
}

public class FriendRequest : BaseEntity
{
    [BsonElement("senderUserId")]
    public string SenderUserId { get; set; } = string.Empty;

    [BsonElement("senderUsername")]
    public string SenderUsername { get; set; } = string.Empty;

    [BsonElement("receiverUserId")]
    public string ReceiverUserId { get; set; } = string.Empty;

    [BsonElement("receiverUsername")]
    public string ReceiverUsername { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "Pending"; // "Pending", "Accepted", "Declined"
}

public class DirectMessage : BaseEntity
{
    [BsonElement("senderUserId")]
    public string SenderUserId { get; set; } = string.Empty;

    [BsonElement("receiverUserId")]
    public string ReceiverUserId { get; set; } = string.Empty;

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("isRead")]
    public bool IsRead { get; set; } = false;
}
