using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;

namespace OTTPro.API.Controllers.V1;

[Route("api/v1/watchparties")]
[Route("api/v1/watch-parties")]
public class WatchPartyController : BaseApiController
{
    private readonly IWatchPartyRepository _partyRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public WatchPartyController(
        IWatchPartyRepository partyRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _partyRepository = partyRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public class CreatePartyRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? VideoSourceUrl { get; set; }
        public string? MediaTitle { get; set; }
        public bool IsPrivate { get; set; } = false;
        public string? Passcode { get; set; }
        public int MaxMembers { get; set; } = 50;
    }

    public class VerifyPasscodeRequest
    {
        public string Passcode { get; set; } = string.Empty;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<object>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetActiveParties(CancellationToken cancellationToken)
    {
        var parties = await _partyRepository.FindAsync(
            p => p.Status == PartyStatus.Active && !p.IsDeleted,
            cancellationToken: cancellationToken);

        var dtoList = new List<object>();
        foreach (var p in parties)
        {
            var host = await _userRepository.GetByIdAsync(p.HostUserId, cancellationToken);
            dtoList.Add(new
            {
                p.Id,
                p.Title,
                p.RoomCode,
                p.HostUserId,
                HostUsername = host?.Username ?? "Host",
                HostFullName = host?.FullName ?? host?.Username ?? "Host",
                HostAvatarUrl = host?.AvatarUrl,
                p.IsPrivate,
                p.MaxMembers,
                p.MemberCount,
                p.CurrentPlayback,
                p.Status,
                p.CreatedAt
            });
        }

        return OkResponse(dtoList, "Active watch parties retrieved.");
    }

    [HttpGet("{roomCode}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> GetPartyByCode(string roomCode, CancellationToken cancellationToken)
    {
        var party = await _partyRepository.GetByRoomCodeAsync(roomCode.ToUpperInvariant(), cancellationToken);
        if (party == null)
        {
            return NotFound(ApiResponse<object>.FailureResponse($"Watch party room '{roomCode}' was not found."));
        }

        var host = await _userRepository.GetByIdAsync(party.HostUserId, cancellationToken);

        return OkResponse<object>(new
        {
            party.Id,
            party.Title,
            party.RoomCode,
            party.HostUserId,
            HostUsername = host?.Username ?? "Host",
            HostFullName = host?.FullName ?? host?.Username ?? "Host",
            HostAvatarUrl = host?.AvatarUrl,
            party.IsPrivate,
            party.MaxMembers,
            party.MemberCount,
            party.CurrentPlayback,
            party.Status,
            party.CreatedAt
        }, "Watch party details retrieved.");
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> CreateParty([FromBody] CreatePartyRequest request, CancellationToken cancellationToken)
    {
        var roomCode = "ROOM-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpperInvariant();
        var party = new WatchParty
        {
            Title = string.IsNullOrWhiteSpace(request.Title) ? "Cinema Night" : request.Title.Trim(),
            HostUserId = _currentUserService.UserId ?? "anonymous",
            RoomCode = roomCode,
            IsPrivate = request.IsPrivate,
            PasscodeHash = !string.IsNullOrEmpty(request.Passcode) ? request.Passcode.Trim() : null,
            MaxMembers = Math.Clamp(request.MaxMembers, 2, 500),
            Status = PartyStatus.Active,
            CurrentPlayback = new PlaybackState
            {
                IsPlaying = false,
                CurrentSeconds = 0,
                VideoUrl = !string.IsNullOrWhiteSpace(request.VideoSourceUrl) ? request.VideoSourceUrl.Trim() : null,
                VideoTitle = !string.IsNullOrWhiteSpace(request.MediaTitle) ? request.MediaTitle.Trim() : null,
                LastUpdatedBy = _currentUserService.UserId ?? "Host",
                UpdatedAt = DateTime.UtcNow
            }
        };

        await _partyRepository.CreateAsync(party, cancellationToken);

        return OkResponse<object>(new
        {
            party.Id,
            party.Title,
            party.RoomCode,
            party.HostUserId,
            party.IsPrivate,
            party.MaxMembers,
            party.Status,
            party.CreatedAt
        }, "Watch party room created successfully.");
    }

    [HttpPost("{roomCode}/verify")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> VerifyPasscode(string roomCode, [FromBody] VerifyPasscodeRequest request, CancellationToken cancellationToken)
    {
        var party = await _partyRepository.GetByRoomCodeAsync(roomCode.ToUpperInvariant(), cancellationToken);
        if (party == null)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Room not found."));
        }

        if (!party.IsPrivate)
        {
            return OkResponse(true, "Public room requires no passcode.");
        }

        var isMatch = party.PasscodeHash == request.Passcode?.Trim();
        if (!isMatch)
        {
            return BadRequest(ApiResponse<bool>.FailureResponse("Incorrect room passcode."));
        }

        return OkResponse(true, "Room unlocked successfully.");
    }

    [Authorize]
    [HttpDelete("{roomCode}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteParty(string roomCode, CancellationToken cancellationToken)
    {
        var party = await _partyRepository.GetByRoomCodeAsync(roomCode.ToUpperInvariant(), cancellationToken);
        if (party == null)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Watch party room not found."));
        }

        var currentUserId = _currentUserService.UserId;
        if (party.HostUserId != currentUserId && !User.IsInRole("Admin"))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<bool>.FailureResponse("Only the host or an admin can delete this watch party."));
        }

        party.Status = PartyStatus.Ended;
        party.IsDeleted = true;
        party.UpdatedAt = DateTime.UtcNow;
        await _partyRepository.UpdateAsync(party, cancellationToken);

        return OkResponse(true, "Watch party room deleted successfully.");
    }
}
