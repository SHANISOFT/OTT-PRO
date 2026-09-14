using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTTPro.Application.Common.Models;
using OTTPro.Application.DTOs.Streaming;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Application.Interfaces.Services;

namespace OTTPro.API.Controllers.V1;

public class StreamingController : BaseApiController
{
    private readonly IStreamingService _streamingService;
    private readonly ICurrentUserService _currentUserService;

    public StreamingController(IStreamingService streamingService, ICurrentUserService currentUserService)
    {
        _streamingService = streamingService;
        _currentUserService = currentUserService;
    }

    [HttpGet("providers")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StreamingProviderInfoDto>>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyList<StreamingProviderInfoDto>>> GetProviders()
    {
        var providers = _streamingService.GetAvailableProviders();
        return OkResponse(providers, "Available authorized OTT providers retrieved.");
    }

    [Authorize]
    [HttpPost("sessions")]
    [ProducesResponseType(typeof(ApiResponse<PlaybackSessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PlaybackSessionDto>>> InitializeSession(
        [FromQuery] string providerId,
        [FromQuery] string contentId,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? "anonymous";
        var session = await _streamingService.InitializePlaybackSessionAsync(userId, providerId, contentId, cancellationToken);
        return OkResponse(session, "Playback session initialized successfully.");
    }

    [HttpGet("sessions/{providerId}/{sessionId}/state")]
    [ProducesResponseType(typeof(ApiResponse<PlaybackStateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PlaybackStateDto>>> GetPlaybackState(
        string providerId,
        string sessionId,
        CancellationToken cancellationToken)
    {
        var state = await _streamingService.CheckPlaybackStateAsync(providerId, sessionId, cancellationToken);
        return OkResponse(state, "Playback state retrieved.");
    }
}
