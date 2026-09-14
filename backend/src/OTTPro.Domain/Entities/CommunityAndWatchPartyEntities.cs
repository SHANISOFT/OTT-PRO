using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;
using OTTPro.Domain.Enums;

namespace OTTPro.Domain.Entities;

public class PlaybackState
{
    [BsonElement("currentSeconds")]
    public double CurrentSeconds { get; set; } = 0.0;

    [BsonElement("isPlaying")]
    public bool IsPlaying { get; set; } = false;

    [BsonElement("videoUrl")]
    public string? VideoUrl { get; set; }

    [BsonElement("videoTitle")]
    public string? VideoTitle { get; set; }

    [BsonElement("lastUpdatedBy")]
    public string LastUpdatedBy { get; set; } = string.Empty;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class WatchParty : BaseEntity, IAuditableEntity
{
    [BsonElement("hostUserId")]
    public string HostUserId { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("mediaType")]
    public MediaType MediaType { get; set; }

    [BsonElement("mediaId")]
    public string MediaId { get; set; } = string.Empty;

    [BsonElement("seasonNumber")]
    public int? SeasonNumber { get; set; }

    [BsonElement("episodeNumber")]
    public int? EpisodeNumber { get; set; }

    [BsonElement("roomCode")]
    public string RoomCode { get; set; } = string.Empty;

    [BsonElement("isPrivate")]
    public bool IsPrivate { get; set; } = false;

    [BsonElement("passcodeHash")]
    public string? PasscodeHash { get; set; }

    [BsonElement("maxMembers")]
    public int MaxMembers { get; set; } = 50;

    [BsonElement("status")]
    public PartyStatus Status { get; set; } = PartyStatus.Active;

    [BsonElement("currentPlayback")]
    public PlaybackState CurrentPlayback { get; set; } = new();

    [BsonElement("memberCount")]
    public int MemberCount { get; set; } = 1;

    [BsonElement("endedAt")]
    public DateTime? EndedAt { get; set; }
}

public class WatchPartyMember : BaseEntity
{
    [BsonElement("partyId")]
    public string PartyId { get; set; } = string.Empty;

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("role")]
    public string Role { get; set; } = "Member"; // Host, CoHost, Member

    [BsonElement("joinedAt")]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("isMuted")]
    public bool IsMuted { get; set; } = false;
}

public class ChatMessage : BaseEntity
{
    [BsonElement("partyId")]
    public string PartyId { get; set; } = string.Empty;

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("type")]
    public string Type { get; set; } = "Text"; // Text, Reaction, SystemAlert
}

public class Notification : BaseEntity
{
    [BsonElement("recipientId")]
    public string RecipientId { get; set; } = string.Empty;

    [BsonElement("actorId")]
    public string ActorId { get; set; } = string.Empty;

    [BsonElement("actorUsername")]
    public string ActorUsername { get; set; } = string.Empty;

    [BsonElement("actorAvatar")]
    public string? ActorAvatar { get; set; }

    [BsonElement("type")]
    public NotificationType Type { get; set; }

    [BsonElement("targetType")]
    public string TargetType { get; set; } = string.Empty;

    [BsonElement("targetId")]
    public string TargetId { get; set; } = string.Empty;

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("isRead")]
    public bool IsRead { get; set; } = false;
}

public class Report : BaseEntity
{
    [BsonElement("reporterUserId")]
    public string ReporterUserId { get; set; } = string.Empty;

    [BsonElement("reportedItemType")]
    public string ReportedItemType { get; set; } = "Post"; // Post, Comment, Review, User

    [BsonElement("reportedItemId")]
    public string ReportedItemId { get; set; } = string.Empty;

    [BsonElement("reason")]
    public ReportReason Reason { get; set; } = ReportReason.Inappropriate;

    [BsonElement("notes")]
    public string? Notes { get; set; }

    [BsonElement("status")]
    public ReportStatus Status { get; set; } = ReportStatus.Pending;

    [BsonElement("resolvedByUserId")]
    public string? ResolvedByUserId { get; set; }

    [BsonElement("resolutionNotes")]
    public string? ResolutionNotes { get; set; }
}
