using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;
using OTTPro.Domain.Enums;

namespace OTTPro.Domain.Entities;

public class User : BaseEntity, IAuditableEntity
{
    [BsonElement("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("bio")]
    public string? Bio { get; set; }

    [BsonElement("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [BsonElement("bannerUrl")]
    public string? BannerUrl { get; set; }

    [BsonElement("roles")]
    public List<string> Roles { get; set; } = new() { nameof(UserRole.User) };

    [BsonElement("isEmailVerified")]
    public bool IsEmailVerified { get; set; } = false;

    [BsonElement("emailVerificationToken")]
    public string? EmailVerificationToken { get; set; }

    [BsonElement("passwordResetToken")]
    public string? PasswordResetToken { get; set; }

    [BsonElement("passwordResetExpires")]
    public DateTime? PasswordResetExpires { get; set; }

    [BsonElement("stats")]
    public UserStats Stats { get; set; } = new();

    [BsonElement("privacy")]
    public UserPrivacy Privacy { get; set; } = new();

    [BsonElement("status")]
    public UserStatus Status { get; set; } = UserStatus.Active;
}

public class UserStats
{
    [BsonElement("followersCount")]
    public int FollowersCount { get; set; } = 0;

    [BsonElement("followingCount")]
    public int FollowingCount { get; set; } = 0;

    [BsonElement("reviewsCount")]
    public int ReviewsCount { get; set; } = 0;

    [BsonElement("watchTimeMinutes")]
    public long WatchTimeMinutes { get; set; } = 0;
}

public class UserPrivacy
{
    [BsonElement("isPrivateProfile")]
    public bool IsPrivateProfile { get; set; } = false;

    [BsonElement("showWatchlist")]
    public bool ShowWatchlist { get; set; } = true;

    [BsonElement("allowDirectPartyInvites")]
    public bool AllowDirectPartyInvites { get; set; } = true;
}

public class RefreshToken : BaseEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("tokenHash")]
    public string TokenHash { get; set; } = string.Empty;

    [BsonElement("jwtId")]
    public string JwtId { get; set; } = string.Empty;

    [BsonElement("isRevoked")]
    public bool IsRevoked { get; set; } = false;

    [BsonElement("replacedByTokenHash")]
    public string? ReplacedByTokenHash { get; set; }

    [BsonElement("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [BsonElement("createdFromIp")]
    public string? CreatedFromIp { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}
