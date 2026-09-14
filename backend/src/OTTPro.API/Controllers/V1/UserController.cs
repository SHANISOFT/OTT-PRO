using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Domain.Entities;

namespace OTTPro.API.Controllers.V1;

[Route("api/v1/users")]
public class UserController : BaseApiController
{
    private readonly IUserRepository _userRepository;
    private readonly IWatchPartyRepository _partyRepository;
    private readonly ICurrentUserService _currentUserService;

    public UserController(
        IUserRepository userRepository,
        IWatchPartyRepository partyRepository,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _partyRepository = partyRepository;
        _currentUserService = currentUserService;
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }
    }

    [HttpGet("{username}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> GetUserProfile(string username, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByUsernameAsync(username.ToLowerInvariant(), cancellationToken);
        if (user == null)
        {
            return NotFound(ApiResponse<object>.FailureResponse($"User '@{username}' was not found."));
        }

        var hostedParties = await _partyRepository.FindAsync(
            p => p.HostUserId == user.Id && !p.IsDeleted,
            cancellationToken: cancellationToken);

        var badges = new List<object>
        {
            new { Id = "early-adopter", Title = "Early Cinephile", Icon = "🌟", Description = "Joined during OTT PRO platform preview" },
            new { Id = "top-host", Title = "Master Host", Icon = "🍿", Description = "Organized synchronized community watch parties" },
            new { Id = "binge-master", Title = "Binge Master", Icon = "📺", Description = "Tracked and completed high-rated television series" }
        };

        var profileObj = new
        {
            user.Id,
            user.Username,
            user.FullName,
            user.Bio,
            user.AvatarUrl,
            user.BannerUrl,
            user.Roles,
            user.CreatedAt,
            Stats = user.Stats ?? new UserStats(),
            Badges = badges,
            HostedPartiesCount = hostedParties.Count,
            HostedParties = hostedParties.Take(5).Select(p => new
            {
                p.Id,
                p.Title,
                p.RoomCode,
                p.Status,
                p.MemberCount,
                p.CreatedAt
            }).ToList()
        };

        return OkResponse<object>(profileObj, "User profile retrieved.");
    }

    [Authorize]
    [HttpPut("profile")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("User identity required."));
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return NotFound(ApiResponse<object>.FailureResponse("User not found."));
        }

        if (request.FullName != null) user.FullName = request.FullName.Trim();
        if (request.Bio != null) user.Bio = request.Bio.Trim();
        if (request.AvatarUrl != null) user.AvatarUrl = request.AvatarUrl.Trim();
        if (request.BannerUrl != null) user.BannerUrl = request.BannerUrl.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user, cancellationToken);

        return OkResponse<object>(new
        {
            user.Id,
            user.Username,
            user.FullName,
            user.Bio,
            user.AvatarUrl,
            user.BannerUrl
        }, "Profile updated successfully.");
    }
}
