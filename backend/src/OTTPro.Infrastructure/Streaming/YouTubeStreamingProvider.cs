using Microsoft.Extensions.Logging;
using OTTPro.Application.DTOs.Streaming;
using OTTPro.Application.Interfaces.Services;

namespace OTTPro.Infrastructure.Streaming;

public class YouTubeStreamingProvider : IStreamingProvider
{
    private readonly ILogger<YouTubeStreamingProvider> _logger;

    public string ProviderId => "youtube";
    public string DisplayName => "YouTube Partner Embed";
    public string IntegrationModel => "EmbeddedSdk";

    public YouTubeStreamingProvider(ILogger<YouTubeStreamingProvider> logger)
    {
        _logger = logger;
    }

    public Task<PlaybackSessionDto> CreatePlaybackSessionAsync(
        string userId,
        string contentId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating authorized YouTube playback session for content {ContentId} by user {UserId}", contentId, userId);

        var session = new PlaybackSessionDto
        {
            SessionId = $"yt-sess-{Guid.NewGuid():N}",
            ProviderId = ProviderId,
            ContentId = contentId,
            Title = "Authorized YouTube Stream",
            EmbedUrl = $"https://www.youtube-nocookie.com/embed/{contentId}?enablejsapi=1&autoplay=1&modestbranding=1&rel=0",
            PlayerType = "YouTubeIFrame",
            RequiresUserEntitlement = false,
            IsUserEntitled = true,
            ExpiresAt = DateTime.UtcNow.AddHours(4),
            Metadata = new Dictionary<string, string>
            {
                { "jsApiEnabled", "true" },
                { "controls", "1" },
                { "nocookie", "true" }
            }
        };

        return Task.FromResult(session);
    }

    public Task<bool> ValidateUserEntitlementAsync(
        string userId,
        string contentId,
        CancellationToken cancellationToken = default)
    {
        // Public / YouTube partner content is openly entitled
        return Task.FromResult(true);
    }

    public Task<PlaybackStateDto> GetPlaybackStateAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new PlaybackStateDto
        {
            SessionId = sessionId,
            State = "Playing",
            CurrentPositionSeconds = 0,
            DurationSeconds = 0,
            ServerTimestamp = DateTime.UtcNow,
            IsEntitled = true
        });
    }

    public Task<bool> IsProviderAvailableAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }
}
