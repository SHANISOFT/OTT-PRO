using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;

namespace OTTPro.API.Controllers.V1;

[Route("api/v1/polls")]
public class PollController : BaseApiController
{
    private readonly IPollRepository _pollRepository;
    private readonly ICurrentUserService _currentUserService;

    public PollController(IPollRepository pollRepository, ICurrentUserService currentUserService)
    {
        _pollRepository = pollRepository;
        _currentUserService = currentUserService;
    }

    public class CreatePollDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; } = "Bigg Boss Fan Poll";
        public List<string> Options { get; set; } = new();
        public int DurationDays { get; set; } = 7;
    }

    public class VoteDto
    {
        public string OptionId { get; set; } = string.Empty;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<object>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetPolls(CancellationToken cancellationToken)
    {
        var polls = await _pollRepository.GetActivePollsAsync(cancellationToken: cancellationToken);
        var currentUserId = _currentUserService.UserId;

        var result = new List<object>();
        foreach (var p in polls)
        {
            var options = await _pollRepository.GetOptionsByPollIdAsync(p.Id, cancellationToken);
            bool hasVoted = false;
            if (!string.IsNullOrEmpty(currentUserId))
            {
                hasVoted = await _pollRepository.HasUserVotedAsync(p.Id, currentUserId, cancellationToken);
            }

            result.Add(new
            {
                p.Id,
                p.Title,
                p.Description,
                p.TotalVotes,
                p.StartsAt,
                p.EndsAt,
                p.Status,
                HasVoted = hasVoted,
                Options = options.Select(o => new
                {
                    o.Id,
                    o.OptionText,
                    o.VotesCount,
                    Percentage = p.TotalVotes > 0 ? Math.Round((double)o.VotesCount / p.TotalVotes * 100, 1) : 0
                }).ToList()
            });
        }

        return OkResponse(result, "Polls retrieved successfully.");
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> CreatePoll([FromBody] CreatePollDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Poll title is required."));
        }

        if (request.Options == null || request.Options.Count < 2)
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Poll must have at least 2 options."));
        }

        var poll = new Poll
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            CreatorUserId = _currentUserService.UserId ?? "admin",
            Status = PollStatus.Active,
            StartsAt = DateTime.UtcNow,
            EndsAt = DateTime.UtcNow.AddDays(Math.Clamp(request.DurationDays, 1, 30)),
            TotalVotes = 0,
            IsOfficialBroadcastPoll = false
        };

        await _pollRepository.CreateAsync(poll, cancellationToken);

        int order = 0;
        foreach (var opt in request.Options)
        {
            if (!string.IsNullOrWhiteSpace(opt))
            {
                var optionEntity = new PollOption
                {
                    PollId = poll.Id,
                    OptionText = opt.Trim(),
                    Order = order++,
                    VotesCount = 0
                };
                await _pollRepository.CreateOptionAsync(optionEntity, cancellationToken);
            }
        }

        return OkResponse<object>(new { poll.Id, poll.Title, poll.Status }, "Poll created successfully.");
    }

    [Authorize]
    [HttpPost("{id}/vote")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<bool>>> Vote(string id, [FromBody] VoteDto request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<bool>.FailureResponse("User must be authenticated to vote."));
        }

        var alreadyVoted = await _pollRepository.HasUserVotedAsync(id, userId, cancellationToken);
        if (alreadyVoted)
        {
            return BadRequest(ApiResponse<bool>.FailureResponse("You have already cast your vote on this poll."));
        }

        var option = await _pollRepository.GetOptionByIdAsync(request.OptionId, cancellationToken);
        if (option == null || option.PollId != id)
        {
            return BadRequest(ApiResponse<bool>.FailureResponse("Invalid poll option selected."));
        }

        var vote = new PollVote
        {
            PollId = id,
            OptionId = request.OptionId,
            UserId = userId,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            VotedAt = DateTime.UtcNow
        };

        await _pollRepository.RecordVoteAsync(vote, cancellationToken);
        await _pollRepository.IncrementOptionVoteCountAsync(request.OptionId, id, cancellationToken);

        return OkResponse(true, "Vote cast successfully.");
    }

    [Authorize]
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePoll(string id, CancellationToken cancellationToken)
    {
        await _pollRepository.DeleteAsync(id, softDelete: true, cancellationToken: cancellationToken);
        return OkResponse(true, "Poll deleted successfully.");
    }
}
