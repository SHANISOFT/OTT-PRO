using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using OTTPro.API.Hubs;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Infrastructure;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;
using OTTPro.Infrastructure.Data;

namespace OTTPro.API.Controllers.V1;

[Authorize(Roles = "Admin,SuperAdmin")]
[Route("api/v1/admin")]
public class AdminController : BaseApiController
{
    private readonly MongoDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHubContext<WatchPartyHub> _hubContext;
    private readonly IPollRepository _pollRepository;
    private readonly ICacheService _cacheService;

    public AdminController(
        MongoDbContext context,
        IUserRepository userRepository,
        ICurrentUserService currentUserService,
        IHubContext<WatchPartyHub> hubContext,
        IPollRepository pollRepository,
        ICacheService cacheService)
    {
        _context = context;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _hubContext = hubContext;
        _pollRepository = pollRepository;
        _cacheService = cacheService;
    }

    // --- DTOs ---
    public class UpdateUserRoleRequest
    {
        public string Role { get; set; } = "User"; // "Admin" or "User"
    }

    public class UpdateUserStatusRequest
    {
        public string Status { get; set; } = "Active"; // "Active", "Banned", "Suspended"
    }

    public class SaveContentRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = "Movie"; // "Movie" or "Show"
        public string? Overview { get; set; }
        public string? PosterPath { get; set; }
        public string? BackdropPath { get; set; }
        public List<string> Genres { get; set; } = new();
        public string? ReleaseDate { get; set; }
        public double Rating { get; set; } = 8.5;
        public int RuntimeMinutes { get; set; } = 120;
        public int TotalSeasons { get; set; } = 1;
        public int TotalEpisodes { get; set; } = 8;
        public string? TrailerUrl { get; set; }
        public string? VideoUrl { get; set; }
    }

    public class AdminCreatePollRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Category { get; set; } = "Official Platform Poll";
        public List<string> Options { get; set; } = new();
        public int DurationDays { get; set; } = 7;
    }

    // 1. STATS / OVERVIEW
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetStats(CancellationToken cancellationToken)
    {
        var totalUsers = await _context.Users.CountDocumentsAsync(u => !u.IsDeleted, cancellationToken: cancellationToken);
        var activeUsers = await _context.Users.CountDocumentsAsync(u => u.Status == UserStatus.Active && !u.IsDeleted, cancellationToken: cancellationToken);
        var bannedUsers = await _context.Users.CountDocumentsAsync(u => u.Status == UserStatus.Banned, cancellationToken: cancellationToken);

        var activeParties = await _context.WatchParties.CountDocumentsAsync(p => p.Status == PartyStatus.Active && !p.IsDeleted, cancellationToken: cancellationToken);
        var totalParties = await _context.WatchParties.CountDocumentsAsync(p => !p.IsDeleted, cancellationToken: cancellationToken);

        var totalShows = await _context.Shows.CountDocumentsAsync(s => !s.IsDeleted, cancellationToken: cancellationToken);
        var totalMovies = await _context.Movies.CountDocumentsAsync(m => !m.IsDeleted, cancellationToken: cancellationToken);

        var totalPolls = await _context.Polls.CountDocumentsAsync(p => !p.IsDeleted, cancellationToken: cancellationToken);
        var totalVotes = await _context.PollVotes.CountDocumentsAsync(_ => true, cancellationToken: cancellationToken);

        return OkResponse<object>(new
        {
            Users = new { Total = totalUsers, Active = activeUsers, Banned = bannedUsers },
            WatchParties = new { Active = activeParties, Total = totalParties },
            Content = new { TotalShows = totalShows, TotalMovies = totalMovies, Total = totalShows + totalMovies },
            Polls = new { TotalPolls = totalPolls, TotalVotes = totalVotes },
            System = new
            {
                Status = "Healthy",
                Environment = "Production / Local",
                Timestamp = DateTime.UtcNow
            }
        }, "Admin platform stats retrieved.");
    }

    // 2. USER MANAGEMENT
    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.Eq(u => u.IsDeleted, false);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLowerInvariant();
            var searchFilter = Builders<User>.Filter.Or(
                Builders<User>.Filter.Regex(u => u.Username, new MongoDB.Bson.BsonRegularExpression(searchLower, "i")),
                Builders<User>.Filter.Regex(u => u.Email, new MongoDB.Bson.BsonRegularExpression(searchLower, "i")),
                Builders<User>.Filter.Regex(u => u.FullName, new MongoDB.Bson.BsonRegularExpression(searchLower, "i"))
            );
            filter = Builders<User>.Filter.And(filter, searchFilter);
        }

        var total = await _context.Users.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
        var users = await _context.Users.Find(filter)
            .SortByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        var result = users.Select(u => new
        {
            u.Id,
            u.Username,
            u.Email,
            u.FullName,
            u.AvatarUrl,
            Roles = u.Roles,
            IsAdmin = u.Roles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase) || r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)),
            Status = u.Status.ToString(),
            u.CreatedAt,
            WatchTime = u.Stats.WatchTimeMinutes
        }).ToList();

        return OkResponse<object>(new { Users = result, Total = total, Page = page, PageSize = pageSize }, "Users list retrieved.");
    }

    [HttpPut("users/{userId}/role")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserRole(string userId, [FromBody] UpdateUserRoleRequest request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.Find(u => u.Id == userId && !u.IsDeleted).FirstOrDefaultAsync(cancellationToken);
        if (user == null) return NotFound(ApiResponse<object>.FailureResponse("User not found."));

        var isAdmin = request.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase);
        if (isAdmin)
        {
            if (!user.Roles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase)))
            {
                user.Roles.Add("Admin");
            }
        }
        else
        {
            user.Roles = user.Roles.Where(r => !r.Equals("Admin", StringComparison.OrdinalIgnoreCase) && !r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)).ToList();
            if (user.Roles.Count == 0) user.Roles.Add("User");
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.Users.ReplaceOneAsync(u => u.Id == userId, user, cancellationToken: cancellationToken);

        return OkResponse<object>(new { user.Id, user.Username, user.Roles, IsAdmin = isAdmin }, $"User role updated to {(isAdmin ? "Admin" : "User")}.");
    }

    [HttpPut("users/{userId}/status")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserStatus(string userId, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.Find(u => u.Id == userId && !u.IsDeleted).FirstOrDefaultAsync(cancellationToken);
        if (user == null) return NotFound(ApiResponse<object>.FailureResponse("User not found."));

        if (Enum.TryParse<UserStatus>(request.Status, true, out var newStatus))
        {
            user.Status = newStatus;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.Users.ReplaceOneAsync(u => u.Id == userId, user, cancellationToken: cancellationToken);

            return OkResponse<object>(new { user.Id, user.Username, Status = user.Status.ToString() }, $"User status changed to {user.Status}.");
        }

        return BadRequest(ApiResponse<object>.FailureResponse("Invalid status value. Use 'Active', 'Suspended', or 'Banned'."));
    }

    // 3. WATCH PARTIES MONITOR & SUPERVISION
    [HttpGet("parties")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetActiveParties(CancellationToken cancellationToken)
    {
        var parties = await _context.WatchParties.Find(p => p.Status == PartyStatus.Active && !p.IsDeleted)
            .SortByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = new List<object>();
        foreach (var p in parties)
        {
            var host = await _userRepository.GetByIdAsync(p.HostUserId, cancellationToken);
            var memberCount = await _context.WatchPartyMembers.CountDocumentsAsync(m => m.PartyId == p.Id && !m.IsDeleted, cancellationToken: cancellationToken);

            result.Add(new
            {
                p.Id,
                p.RoomCode,
                p.Title,
                p.IsPrivate,
                p.Status,
                p.CreatedAt,
                HostUserId = p.HostUserId,
                HostUsername = host?.Username ?? "Host",
                HostAvatarUrl = host?.AvatarUrl,
                MemberCount = memberCount > 0 ? memberCount : 1,
                CurrentPlayback = p.CurrentPlayback
            });
        }

        return OkResponse<object>(result, "Active watch parties retrieved.");
    }

    [HttpDelete("parties/{roomCode}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> ForceTerminateParty(string roomCode, CancellationToken cancellationToken)
    {
        var party = await _context.WatchParties.Find(p => p.RoomCode == roomCode.ToUpperInvariant() && !p.IsDeleted).FirstOrDefaultAsync(cancellationToken);
        if (party == null) return NotFound(ApiResponse<bool>.FailureResponse("Watch party not found."));

        party.Status = PartyStatus.Ended;
        party.EndedAt = DateTime.UtcNow;
        party.IsDeleted = true;
        party.UpdatedAt = DateTime.UtcNow;
        await _context.WatchParties.ReplaceOneAsync(p => p.Id == party.Id, party, cancellationToken: cancellationToken);

        // Broadcast termination to everyone in the room via SignalR
        await _hubContext.Clients.Group(party.RoomCode).SendAsync("PartyClosed", new
        {
            message = "This watch party was terminated by an administrator for violation of platform policies."
        }, cancellationToken);

        return OkResponse(true, $"Watch party {roomCode} was terminated by admin.");
    }

    // 4. CONTENT CMS (Movies & Shows)
    [HttpGet("content")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> GetAllContent(CancellationToken cancellationToken)
    {
        var shows = await _context.Shows.Find(s => !s.IsDeleted).SortByDescending(s => s.CreatedAt).ToListAsync(cancellationToken);
        var movies = await _context.Movies.Find(m => !m.IsDeleted).SortByDescending(m => m.CreatedAt).ToListAsync(cancellationToken);

        var combined = new List<object>();

        foreach (var s in shows)
        {
            combined.Add(new
            {
                s.Id,
                s.Title,
                Type = "Show",
                s.Overview,
                s.PosterPath,
                s.BackdropPath,
                s.Genres,
                s.ReleaseDate,
                Rating = s.RatingSummary.AverageRating,
                s.TotalSeasons,
                s.TotalEpisodes,
                s.TrailerUrl,
                s.VideoUrl,
                s.CreatedAt
            });
        }

        foreach (var m in movies)
        {
            combined.Add(new
            {
                m.Id,
                m.Title,
                Type = "Movie",
                m.Overview,
                m.PosterPath,
                m.BackdropPath,
                m.Genres,
                m.ReleaseDate,
                Rating = m.RatingSummary.AverageRating,
                RuntimeMinutes = m.RuntimeMinutes,
                m.TrailerUrl,
                m.VideoUrl,
                m.CreatedAt
            });
        }

        return OkResponse<object>(combined, "Catalog retrieved.");
    }

    [HttpPost("content")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> CreateContent([FromBody] SaveContentRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Title is required."));
        }

        var slug = request.Title.Trim().ToLowerInvariant().Replace(" ", "-");

        if (request.Type.Equals("Show", StringComparison.OrdinalIgnoreCase))
        {
            var show = new Show
            {
                Title = request.Title.Trim(),
                Slug = slug,
                Overview = request.Overview ?? string.Empty,
                PosterPath = request.PosterPath,
                BackdropPath = request.BackdropPath,
                Genres = request.Genres,
                ReleaseDate = request.ReleaseDate,
                TotalSeasons = request.TotalSeasons,
                TotalEpisodes = request.TotalEpisodes,
                TrailerUrl = request.TrailerUrl,
                VideoUrl = request.VideoUrl,
                RatingSummary = new RatingSummary { AverageRating = request.Rating, TotalRatings = 1 },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.Shows.InsertOneAsync(show, cancellationToken: cancellationToken);
            await _cacheService.RemoveAsync("discovery:trending", cancellationToken);
            return OkResponse<object>(show, "Show created successfully.");
        }
        else
        {
            var movie = new Movie
            {
                Title = request.Title.Trim(),
                Slug = slug,
                Overview = request.Overview ?? string.Empty,
                PosterPath = request.PosterPath,
                BackdropPath = request.BackdropPath,
                Genres = request.Genres,
                ReleaseDate = request.ReleaseDate,
                RuntimeMinutes = request.RuntimeMinutes,
                TrailerUrl = request.TrailerUrl,
                VideoUrl = request.VideoUrl,
                RatingSummary = new RatingSummary { AverageRating = request.Rating, TotalRatings = 1 },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.Movies.InsertOneAsync(movie, cancellationToken: cancellationToken);
            await _cacheService.RemoveAsync("discovery:trending", cancellationToken);
            return OkResponse<object>(movie, "Movie created successfully.");
        }
    }

    [HttpDelete("content/{type}/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteContent(string type, string id, CancellationToken cancellationToken)
    {
        if (type.Equals("Show", StringComparison.OrdinalIgnoreCase))
        {
            var update = Builders<Show>.Update.Set(s => s.IsDeleted, true).Set(s => s.UpdatedAt, DateTime.UtcNow);
            var res = await _context.Shows.UpdateOneAsync(s => s.Id == id, update, cancellationToken: cancellationToken);
            await _cacheService.RemoveAsync("discovery:trending", cancellationToken);
            return OkResponse(res.ModifiedCount > 0, "Show removed.");
        }
        else
        {
            var update = Builders<Movie>.Update.Set(m => m.IsDeleted, true).Set(m => m.UpdatedAt, DateTime.UtcNow);
            var res = await _context.Movies.UpdateOneAsync(m => m.Id == id, update, cancellationToken: cancellationToken);
            await _cacheService.RemoveAsync("discovery:trending", cancellationToken);
            return OkResponse(res.ModifiedCount > 0, "Movie removed.");
        }
    }

    [HttpPost("cache/clear")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> ClearCache(CancellationToken cancellationToken)
    {
        await _cacheService.RemoveAsync("discovery:trending", cancellationToken);
        return OkResponse(true, "Catalog cache purged successfully.");
    }

    // 5. OFFICIAL POLLS
    [HttpPost("polls")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> CreateOfficialPoll([FromBody] AdminCreatePollRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(ApiResponse<object>.FailureResponse("Poll title is required."));
        }

        if (request.Options == null || request.Options.Count < 2)
        {
            return BadRequest(ApiResponse<object>.FailureResponse("A poll must contain at least 2 options."));
        }

        var poll = new Poll
        {
            Title = request.Title.Trim(),
            Description = request.Description ?? request.Category,
            IsOfficialBroadcastPoll = true,
            CreatorUserId = _currentUserService.UserId ?? "admin",
            StartsAt = DateTime.UtcNow,
            EndsAt = DateTime.UtcNow.AddDays(request.DurationDays),
            Status = PollStatus.Active,
            TotalVotes = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Polls.InsertOneAsync(poll, cancellationToken: cancellationToken);

        var optionEntities = new List<PollOption>();
        int order = 1;
        foreach (var opt in request.Options)
        {
            if (string.IsNullOrWhiteSpace(opt)) continue;
            var o = new PollOption
            {
                PollId = poll.Id,
                OptionText = opt.Trim(),
                Order = order++,
                VotesCount = 0,
                CreatedAt = DateTime.UtcNow
            };
            optionEntities.Add(o);
        }

        if (optionEntities.Count > 0)
        {
            await _context.PollOptions.InsertManyAsync(optionEntities, cancellationToken: cancellationToken);
        }

        return OkResponse<object>(new { poll.Id, poll.Title, OptionsCount = optionEntities.Count }, "Official poll launched successfully.");
    }

    [HttpDelete("polls/{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePoll(string id, CancellationToken cancellationToken)
    {
        var update = Builders<Poll>.Update.Set(p => p.IsDeleted, true).Set(p => p.UpdatedAt, DateTime.UtcNow);
        var res = await _context.Polls.UpdateOneAsync(p => p.Id == id, update, cancellationToken: cancellationToken);
        return OkResponse(res.ModifiedCount > 0, "Poll removed.");
    }
}
