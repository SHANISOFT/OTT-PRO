using Microsoft.Extensions.Logging;
using OTTPro.Application.Common.Exceptions;
using OTTPro.Application.DTOs.Streaming;
using OTTPro.Application.Interfaces.Services;

namespace OTTPro.Infrastructure.Streaming;

public class StreamingService : IStreamingService
{
    private readonly IEnumerable<IStreamingProvider> _providers;
    private readonly ILogger<StreamingService> _logger;

    public StreamingService(IEnumerable<IStreamingProvider> providers, ILogger<StreamingService> logger)
    {
        _providers = providers;
        _logger = logger;
    }

    public IReadOnlyList<StreamingProviderInfoDto> GetAvailableProviders()
    {
        return _providers.Select(p => new StreamingProviderInfoDto
        {
            ProviderId = p.ProviderId,
            DisplayName = p.DisplayName,
            IntegrationModel = p.IntegrationModel,
            IsAvailable = true,
            LogoUrl = $"/assets/providers/{p.ProviderId}.png",
            Description = $"Authorized legal playback integration for {p.DisplayName}"
        }).ToList();
    }

    public async Task<PlaybackSessionDto> InitializePlaybackSessionAsync(
        string userId,
        string providerId,
        string contentId,
        CancellationToken cancellationToken = default)
    {
        var provider = _providers.FirstOrDefault(p => p.ProviderId.Equals(providerId, StringComparison.OrdinalIgnoreCase))
            ?? throw new NotFoundException($"Streaming provider '{providerId}' is not registered or supported.");

        var isAvailable = await provider.IsProviderAvailableAsync(cancellationToken);
        if (!isAvailable)
        {
            throw new BadRequestException($"Provider '{provider.DisplayName}' is temporarily unavailable.");
        }

        var isEntitled = await provider.ValidateUserEntitlementAsync(userId, contentId, cancellationToken);
        if (!isEntitled)
        {
            throw new ForbiddenException($"You do not have an active entitlement or subscription to stream this content via {provider.DisplayName}.");
        }

        return await provider.CreatePlaybackSessionAsync(userId, contentId, cancellationToken);
    }

    public async Task<PlaybackStateDto> CheckPlaybackStateAsync(
        string providerId,
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        var provider = _providers.FirstOrDefault(p => p.ProviderId.Equals(providerId, StringComparison.OrdinalIgnoreCase))
            ?? throw new NotFoundException($"Streaming provider '{providerId}' not found.");

        return await provider.GetPlaybackStateAsync(sessionId, cancellationToken);
    }

    public async Task<bool> VerifyEntitlementAsync(
        string userId,
        string providerId,
        string contentId,
        CancellationToken cancellationToken = default)
    {
        var provider = _providers.FirstOrDefault(p => p.ProviderId.Equals(providerId, StringComparison.OrdinalIgnoreCase))
            ?? throw new NotFoundException($"Streaming provider '{providerId}' not found.");

        return await provider.ValidateUserEntitlementAsync(userId, contentId, cancellationToken);
    }
}
