using OTTPro.Application.DTOs.Streaming;

namespace OTTPro.Application.Interfaces.Services;

public interface IStreamingProvider
{
    string ProviderId { get; }
    string DisplayName { get; }
    string IntegrationModel { get; } // "Sdk", "Api", "AccountSync", "LegalPlayer", "ScreenShare"

    Task<PlaybackSessionDto> CreatePlaybackSessionAsync(
        string userId,
        string contentId,
        CancellationToken cancellationToken = default);

    Task<bool> ValidateUserEntitlementAsync(
        string userId,
        string contentId,
        CancellationToken cancellationToken = default);

    Task<PlaybackStateDto> GetPlaybackStateAsync(
        string sessionId,
        CancellationToken cancellationToken = default);

    Task<bool> IsProviderAvailableAsync(
        CancellationToken cancellationToken = default);
}

public interface IStreamingService
{
    IReadOnlyList<StreamingProviderInfoDto> GetAvailableProviders();
    Task<PlaybackSessionDto> InitializePlaybackSessionAsync(string userId, string providerId, string contentId, CancellationToken cancellationToken = default);
    Task<PlaybackStateDto> CheckPlaybackStateAsync(string providerId, string sessionId, CancellationToken cancellationToken = default);
    Task<bool> VerifyEntitlementAsync(string userId, string providerId, string contentId, CancellationToken cancellationToken = default);
}
