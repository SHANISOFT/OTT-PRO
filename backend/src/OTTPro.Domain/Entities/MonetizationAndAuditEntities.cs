using MongoDB.Bson.Serialization.Attributes;
using OTTPro.Domain.Common;
using OTTPro.Domain.Enums;

namespace OTTPro.Domain.Entities;

public class Subscription : BaseEntity, IAuditableEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("tier")]
    public SubscriptionTier Tier { get; set; } = SubscriptionTier.Free;

    [BsonElement("status")]
    public string Status { get; set; } = "Active"; // Active, PastDue, Cancelled

    [BsonElement("amount")]
    public decimal Amount { get; set; } = 0.0m;

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("startDate")]
    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    [BsonElement("currentPeriodEnd")]
    public DateTime CurrentPeriodEnd { get; set; } = DateTime.UtcNow.AddMonths(1);

    [BsonElement("cancelAtPeriodEnd")]
    public bool CancelAtPeriodEnd { get; set; } = false;
}

public class Payment : BaseEntity, IAuditableEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("subscriptionId")]
    public string? SubscriptionId { get; set; }

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("paymentMethod")]
    public string PaymentMethod { get; set; } = "Card";

    [BsonElement("transactionId")]
    public string TransactionId { get; set; } = string.Empty;

    [BsonElement("status")]
    public PaymentStatus Status { get; set; } = PaymentStatus.Completed;
}

public class Coupon : BaseEntity
{
    [BsonElement("code")]
    public string Code { get; set; } = string.Empty;

    [BsonElement("discountPercentage")]
    public int DiscountPercentage { get; set; } = 0;

    [BsonElement("maxUses")]
    public int MaxUses { get; set; } = 100;

    [BsonElement("currentUses")]
    public int CurrentUses { get; set; } = 0;

    [BsonElement("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;
}

public class UserSession : BaseEntity
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("device")]
    public string Device { get; set; } = "Unknown Browser";

    [BsonElement("ipAddress")]
    public string IpAddress { get; set; } = string.Empty;

    [BsonElement("refreshTokenHash")]
    public string RefreshTokenHash { get; set; } = string.Empty;

    [BsonElement("lastActiveAt")]
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

    [BsonElement("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [BsonElement("isRevoked")]
    public bool IsRevoked { get; set; } = false;
}

public class AuditLog : BaseEntity
{
    [BsonElement("userId")]
    public string? UserId { get; set; }

    [BsonElement("userEmail")]
    public string? UserEmail { get; set; }

    [BsonElement("action")]
    public string Action { get; set; } = string.Empty; // e.g. "USER_BANNED", "ROOM_SUSPENDED", "ROLE_UPDATED"

    [BsonElement("targetResource")]
    public string TargetResource { get; set; } = string.Empty;

    [BsonElement("targetId")]
    public string? TargetId { get; set; }

    [BsonElement("details")]
    public string Details { get; set; } = string.Empty;

    [BsonElement("ipAddress")]
    public string? IpAddress { get; set; }

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class ModerationReport : BaseEntity, IAuditableEntity
{
    [BsonElement("reporterUserId")]
    public string ReporterUserId { get; set; } = string.Empty;

    [BsonElement("targetType")]
    public string TargetType { get; set; } = "User"; // "User", "ChatMessage", "Post", "Comment", "WatchParty"

    [BsonElement("targetId")]
    public string TargetId { get; set; } = string.Empty;

    [BsonElement("reason")]
    public ReportReason Reason { get; set; } = ReportReason.Inappropriate;

    [BsonElement("notes")]
    public string? Notes { get; set; }

    [BsonElement("status")]
    public ReportStatus Status { get; set; } = ReportStatus.Pending;

    [BsonElement("resolvedByUserId")]
    public string? ResolvedByUserId { get; set; }

    [BsonElement("resolvedAt")]
    public DateTime? ResolvedAt { get; set; }

    [BsonElement("resolutionNotes")]
    public string? ResolutionNotes { get; set; }
}
