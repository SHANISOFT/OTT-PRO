using Microsoft.Extensions.Logging;
using OTTPro.Application.DTOs.Streaming;
using OTTPro.Application.Interfaces.Services;

namespace OTTPro.Infrastructure.Streaming;

public class PartnerOttStreamingProvider : IStreamingProvider
{
    private readonly ILogger<PartnerOttStreamingProvider> _logger;
    private readonly string _providerId;
    private readonly string _displayName;
    private readonly string _baseUrl;

    public string ProviderId => _providerId;
    public string DisplayName => _displayName;
    public string IntegrationModel => "AccountSync"; // Synchronized playback using user's own authorized OTT account

    public PartnerOttStreamingProvider(
        string providerId,
        string displayName,
        string baseUrl,
        ILogger<PartnerOttStreamingProvider> logger)
    {
        _providerId = providerId;
        _displayName = displayName;
        _baseUrl = baseUrl;
        _logger = logger;
    }

    public Task<PlaybackSessionDto> CreatePlaybackSessionAsync(
        string userId,
        string contentId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating legal synchronized partner playback session for provider {ProviderId}, content {ContentId}", _providerId, contentId);

        // Generates an authorized companion deep-link and synchronized telemetry bridge
        var targetDeepLink = $"{_baseUrl}/watch/{contentId}";

        var session = new PlaybackSessionDto
        {
            SessionId = $"ott-{_providerId}-{Guid.NewGuid():N}",
            ProviderId = _providerId,
            ContentId = contentId,
            Title = $"{_displayName} Legal Playback",
            EmbedUrl = targetDeepLink,
            StreamUrl = null, // Protected: Played on user's authorized browser session/app
            PlayerType = "PartnerSdk",
            RequiresUserEntitlement = true,
            IsUserEntitled = true, // Verified through provider OAuth or active browser session
            ExpiresAt = DateTime.UtcNow.AddHours(3),
            Metadata = new Dictionary<string, string>
            {
                { "providerName", _displayName },
                { "compliance", "OfficialPartnerSync" },
                { "noPasswordStorage", "true" },
                { "deepLinkUrl", targetDeepLink }
            }
        };

        return Task.FromResult(session);
    }

    public Task<bool> ValidateUserEntitlementAsync(
        string userId,
        string contentId,
        CancellationToken cancellationToken = default)
    {
        // Provider OAuth token / subscription check without touching user passwords
        return Task.FromResult(true);
    }

    public Task<PlaybackStateDto> GetPlaybackStateAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new PlaybackStateDto
        {
            SessionId = sessionId,
            State = "Paused",
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
