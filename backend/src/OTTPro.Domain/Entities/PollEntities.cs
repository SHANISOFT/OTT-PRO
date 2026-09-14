using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;
using OTTPro.Domain.Enums;

namespace OTTPro.Domain.Entities;

public class Poll : BaseEntity, IAuditableEntity
{
    [BsonElement("creatorUserId")]
    public string CreatorUserId { get; set; } = string.Empty;

    [BsonElement("showId")]
    public string? ShowId { get; set; }

    [BsonElement("roomId")]
    public string? RoomId { get; set; }

    [BsonElement("communityId")]
    public string? CommunityId { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("pollType")]
    public PollType PollType { get; set; } = PollType.SingleChoice;

    [BsonElement("status")]
    public PollStatus Status { get; set; } = PollStatus.Active;

    [BsonElement("isAnonymous")]
    public bool IsAnonymous { get; set; } = false;

    [BsonElement("hideResultsUntilClosed")]
    public bool HideResultsUntilClosed { get; set; } = false;

    [BsonElement("totalVotes")]
    public int TotalVotes { get; set; } = 0;

    [BsonElement("startsAt")]
    public DateTime StartsAt { get; set; } = DateTime.UtcNow;

    [BsonElement("endsAt")]
    public DateTime? EndsAt { get; set; }

    [BsonElement("isOfficialBroadcastPoll")]
    public bool IsOfficialBroadcastPoll { get; set; } = false; // Always false for fan polls with disclaimer
}

public class PollOption : BaseEntity
{
    [BsonElement("pollId")]
    public string PollId { get; set; } = string.Empty;

    [BsonElement("optionText")]
    public string OptionText { get; set; } = string.Empty;

    [BsonElement("imageUrl")]
    public string? ImageUrl { get; set; }

    [BsonElement("order")]
    public int Order { get; set; } = 0;

    [BsonElement("votesCount")]
    public int VotesCount { get; set; } = 0;
}

public class PollVote : BaseEntity
{
    [BsonElement("pollId")]
    public string PollId { get; set; } = string.Empty;

    [BsonElement("optionId")]
    public string OptionId { get; set; } = string.Empty;

    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("ipAddress")]
    public string? IpAddress { get; set; }

    [BsonElement("votedAt")]
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;
}
