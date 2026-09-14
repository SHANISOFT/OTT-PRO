using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Domain.Entities;
using OTTPro.Infrastructure.Data;

namespace OTTPro.API.Controllers.V1;

[Authorize]
[Route("api/v1/friends")]
public class FriendshipController : BaseApiController
{
    private readonly MongoDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public FriendshipController(
        MongoDbContext context,
        IUserRepository userRepository,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public class SendMessageRequest
    {
        public string Message { get; set; } = string.Empty;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetFriendsAndRequests(CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("User identity required."));
        }

        // 1. Pending incoming requests
        var incomingRequests = await _context.FriendRequests
            .Find(r => r.ReceiverUserId == currentUserId && r.Status == "Pending" && !r.IsDeleted)
            .ToListAsync(cancellationToken);

        // 2. Pending outgoing requests sent by current user
        var outgoingRequests = await _context.FriendRequests
            .Find(r => r.SenderUserId == currentUserId && r.Status == "Pending" && !r.IsDeleted)
            .ToListAsync(cancellationToken);

        // 3. Accepted friends (either sender or receiver)
        var acceptedFriendships = await _context.FriendRequests
            .Find(r => (r.SenderUserId == currentUserId || r.ReceiverUserId == currentUserId) && r.Status == "Accepted" && !r.IsDeleted)
            .ToListAsync(cancellationToken);

        var friendUserIds = acceptedFriendships
            .Select(f => f.SenderUserId == currentUserId ? f.ReceiverUserId : f.SenderUserId)
            .Distinct()
            .ToList();

        var friendsList = new List<object>();
        foreach (var fid in friendUserIds)
        {
            var u = await _userRepository.GetByIdAsync(fid, cancellationToken);
            if (u != null)
            {
                friendsList.Add(new
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.AvatarUrl,
                    IsOnline = true // Defaults online for connected active session
                });
            }
        }

        return OkResponse<object>(new
        {
            Friends = friendsList,
            IncomingRequests = incomingRequests.Select(r => new
            {
                r.Id,
                r.SenderUserId,
                r.SenderUsername,
                r.CreatedAt
            }).ToList(),
            OutgoingRequests = outgoingRequests.Select(r => new
            {
                r.Id,
                r.ReceiverUserId,
                r.ReceiverUsername,
                r.CreatedAt
            }).ToList()
        }, "Friends and requests retrieved.");
    }

    [HttpGet("status/{targetUsername}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetFriendshipStatus(string targetUsername, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized(ApiResponse<object>.FailureResponse("User identity required."));

        var targetUser = await _userRepository.GetByUsernameAsync(targetUsername.ToLowerInvariant(), cancellationToken);
        if (targetUser == null)
        {
            return OkResponse<object>(new { Status = "None" }, "No relationship.");
        }

        if (targetUser.Id == currentUserId)
        {
            return OkResponse<object>(new { Status = "Self" }, "Same user.");
        }

        var req = await _context.FriendRequests.Find(r =>
            ((r.SenderUserId == currentUserId && r.ReceiverUserId == targetUser.Id) ||
             (r.SenderUserId == targetUser.Id && r.ReceiverUserId == currentUserId)) &&
            !r.IsDeleted
        ).SortByDescending(r => r.CreatedAt).FirstOrDefaultAsync(cancellationToken);

        if (req == null)
        {
            return OkResponse<object>(new { Status = "None" }, "No relationship.");
        }

        if (req.Status == "Accepted")
        {
            return OkResponse<object>(new { Status = "Friends", RequestId = req.Id }, "Already friends.");
        }

        if (req.Status == "Pending")
        {
            var isSender = req.SenderUserId == currentUserId;
            return OkResponse<object>(new { 
                Status = isSender ? "PendingOutgoing" : "PendingIncoming",
                RequestId = req.Id 
            }, "Friend request pending.");
        }

        return OkResponse<object>(new { Status = "None" }, "No relationship.");
    }

    [HttpPost("request/{targetUsername}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> SendFriendRequest(string targetUsername, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        var currentUser = await _userRepository.GetByIdAsync(currentUserId!, cancellationToken);
        if (currentUser == null) return Unauthorized(ApiResponse<object>.FailureResponse("User not found."));

        var targetUser = await _userRepository.GetByUsernameAsync(targetUsername.ToLowerInvariant(), cancellationToken);
        if (targetUser == null)
        {
            return NotFound(ApiResponse<object>.FailureResponse($"User '@{targetUsername}' not found."));
        }

        if (targetUser.Id == currentUserId)
        {
            return BadRequest(ApiResponse<object>.FailureResponse("You cannot send a friend request to yourself."));
        }

        // Check if existing request exists
        var existing = await _context.FriendRequests.Find(r =>
            ((r.SenderUserId == currentUserId && r.ReceiverUserId == targetUser.Id) ||
             (r.SenderUserId == targetUser.Id && r.ReceiverUserId == currentUserId)) &&
            !r.IsDeleted
        ).FirstOrDefaultAsync(cancellationToken);

        if (existing != null)
        {
            if (existing.Status == "Accepted")
            {
                return BadRequest(ApiResponse<object>.FailureResponse("You are already friends with this user."));
            }
            if (existing.Status == "Pending")
            {
                return BadRequest(ApiResponse<object>.FailureResponse("Friend request already pending."));
            }
        }

        var req = new FriendRequest
        {
            SenderUserId = currentUserId,
            SenderUsername = currentUser.Username,
            ReceiverUserId = targetUser.Id,
            ReceiverUsername = targetUser.Username,
            Status = "Pending"
        };

        await _context.FriendRequests.InsertOneAsync(req, cancellationToken: cancellationToken);

        return OkResponse<object>(new { req.Id, req.ReceiverUsername, req.Status }, "Friend request sent.");
    }

    [HttpPost("respond/{requestId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> RespondFriendRequest(string requestId, [FromQuery] bool accept, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        var req = await _context.FriendRequests.Find(r => r.Id == requestId && r.ReceiverUserId == currentUserId).FirstOrDefaultAsync(cancellationToken);
        if (req == null)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Friend request not found."));
        }

        var update = Builders<FriendRequest>.Update.Set(r => r.Status, accept ? "Accepted" : "Declined");
        await _context.FriendRequests.UpdateOneAsync(r => r.Id == requestId, update, cancellationToken: cancellationToken);

        return OkResponse(true, accept ? "Friend request accepted!" : "Friend request declined.");
    }

    [HttpGet("messages/{friendId}")]
    [ProducesResponseType(typeof(ApiResponse<List<object>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetDirectMessages(string friendId, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        var filter = Builders<DirectMessage>.Filter.Or(
            Builders<DirectMessage>.Filter.And(
                Builders<DirectMessage>.Filter.Eq(m => m.SenderUserId, currentUserId),
                Builders<DirectMessage>.Filter.Eq(m => m.ReceiverUserId, friendId)
            ),
            Builders<DirectMessage>.Filter.And(
                Builders<DirectMessage>.Filter.Eq(m => m.SenderUserId, friendId),
                Builders<DirectMessage>.Filter.Eq(m => m.ReceiverUserId, currentUserId)
            )
        );

        var messages = await _context.DirectMessages
            .Find(filter)
            .SortBy(m => m.CreatedAt)
            .Limit(100)
            .ToListAsync(cancellationToken);

        var dtoList = messages.Select(m => (object)new
        {
            m.Id,
            m.SenderUserId,
            m.ReceiverUserId,
            m.Message,
            IsMine = m.SenderUserId == currentUserId,
            m.CreatedAt
        }).ToList();

        return OkResponse(dtoList, "Direct messages retrieved.");
    }

    [HttpPost("messages/{friendId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> SendDirectMessage(string friendId, [FromBody] SendMessageRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Message cannot be empty."));
        }

        var dm = new DirectMessage
        {
            SenderUserId = currentUserId!,
            ReceiverUserId = friendId,
            Message = request.Message.Trim(),
            IsRead = false
        };

        await _context.DirectMessages.InsertOneAsync(dm, cancellationToken: cancellationToken);

        return OkResponse<object>(new
        {
            dm.Id,
            dm.SenderUserId,
            dm.ReceiverUserId,
            dm.Message,
            IsMine = true,
            dm.CreatedAt
        }, "Message sent.");
    }
}
