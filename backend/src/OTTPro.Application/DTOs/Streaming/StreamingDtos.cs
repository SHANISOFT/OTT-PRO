namespace OTTPro.Application.DTOs.Streaming;

public class PlaybackSessionDto
{
    public string SessionId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public string ContentId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string EmbedUrl { get; set; } = string.Empty;
    public string? StreamUrl { get; set; }
    public string? AuthToken { get; set; }
    public string PlayerType { get; set; } = "EmbeddedSdk"; // "YouTubeIFrame", "PartnerSdk", "LegalHls", "ScreenShare"
    public bool RequiresUserEntitlement { get; set; }
    public bool IsUserEntitled { get; set; }
    public DateTime ExpiresAt { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
}

public class PlaybackStateDto
{
    public string SessionId { get; set; } = string.Empty;
    public string State { get; set; } = "Paused"; // "Playing", "Paused", "Buffering", "Completed"
    public double CurrentPositionSeconds { get; set; }
    public double DurationSeconds { get; set; }
    public DateTime ServerTimestamp { get; set; } = DateTime.UtcNow;
    public bool IsEntitled { get; set; }
}

public class StreamingProviderInfoDto
{
    public string ProviderId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string IntegrationModel { get; set; } = string.Empty; // "Sdk", "Api", "AccountSync", "LegalPlayer", "ScreenShare"
    public bool IsAvailable { get; set; }
    public string Description { get; set; } = string.Empty;
}
