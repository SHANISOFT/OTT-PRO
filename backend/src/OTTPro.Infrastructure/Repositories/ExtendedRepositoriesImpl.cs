using MongoDB.Driver;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;
using OTTPro.Infrastructure.Data;

namespace OTTPro.Infrastructure.Repositories;

public class PollRepository : BaseRepository<Poll>, IPollRepository
{
    private readonly IMongoCollection<PollOption> _optionsCollection;
    private readonly IMongoCollection<PollVote> _votesCollection;

    public PollRepository(MongoDbContext context) : base(context, "polls")
    {
        _optionsCollection = context.PollOptions;
        _votesCollection = context.PollVotes;
    }

    public async Task<IReadOnlyList<Poll>> GetActivePollsAsync(string? showId = null, string? roomId = null, CancellationToken cancellationToken = default)
    {
        var filterBuilder = Builders<Poll>.Filter;
        var filter = filterBuilder.And(
            filterBuilder.Eq(p => p.Status, PollStatus.Active),
            filterBuilder.Eq(p => p.IsDeleted, false)
        );

        if (!string.IsNullOrEmpty(showId))
        {
            filter = filterBuilder.And(filter, filterBuilder.Eq(p => p.ShowId, showId));
        }

        if (!string.IsNullOrEmpty(roomId))
        {
            filter = filterBuilder.And(filter, filterBuilder.Eq(p => p.RoomId, roomId));
        }

        return await _collection.Find(filter).SortByDescending(p => p.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PollOption>> GetOptionsByPollIdAsync(string pollId, CancellationToken cancellationToken = default)
    {
        return await _optionsCollection.Find(o => o.PollId == pollId && !o.IsDeleted).SortBy(o => o.Order).ToListAsync(cancellationToken);
    }

    public async Task<PollOption?> GetOptionByIdAsync(string optionId, CancellationToken cancellationToken = default)
    {
        return await _optionsCollection.Find(o => o.Id == optionId && !o.IsDeleted).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> HasUserVotedAsync(string pollId, string userId, CancellationToken cancellationToken = default)
    {
        return await _votesCollection.Find(v => v.PollId == pollId && v.UserId == userId).AnyAsync(cancellationToken);
    }

    public async Task RecordVoteAsync(PollVote vote, CancellationToken cancellationToken = default)
    {
        await _votesCollection.InsertOneAsync(vote, cancellationToken: cancellationToken);
    }

    public async Task IncrementOptionVoteCountAsync(string optionId, string pollId, CancellationToken cancellationToken = default)
    {
        var optionUpdate = Builders<PollOption>.Update.Inc(o => o.VotesCount, 1);
        await _optionsCollection.UpdateOneAsync(o => o.Id == optionId, optionUpdate, cancellationToken: cancellationToken);

        var pollUpdate = Builders<Poll>.Update.Inc(p => p.TotalVotes, 1);
        await _collection.UpdateOneAsync(p => p.Id == pollId, pollUpdate, cancellationToken: cancellationToken);
    }

    public async Task CreateOptionAsync(PollOption option, CancellationToken cancellationToken = default)
    {
        await _optionsCollection.InsertOneAsync(option, cancellationToken: cancellationToken);
    }
}

public class UserSessionRepository : BaseRepository<UserSession>, IUserSessionRepository
{
    public UserSessionRepository(MongoDbContext context) : base(context, "user_sessions") { }

    public async Task<IReadOnlyList<UserSession>> GetActiveSessionsByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _collection.Find(s => s.UserId == userId && !s.IsRevoked && s.ExpiresAt > now).SortByDescending(s => s.LastActiveAt).ToListAsync(cancellationToken);
    }

    public async Task<UserSession?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        return await _collection.Find(s => s.RefreshTokenHash == tokenHash && !s.IsRevoked).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task RevokeSessionAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        var update = Builders<UserSession>.Update.Set(s => s.IsRevoked, true);
        await _collection.UpdateOneAsync(s => s.Id == sessionId, update, cancellationToken: cancellationToken);
    }

    public async Task RevokeAllSessionsExceptCurrentAsync(string userId, string currentSessionId, CancellationToken cancellationToken = default)
    {
        var update = Builders<UserSession>.Update.Set(s => s.IsRevoked, true);
        await _collection.UpdateManyAsync(s => s.UserId == userId && s.Id != currentSessionId && !s.IsRevoked, update, cancellationToken: cancellationToken);
    }
}

public class SubscriptionRepository : BaseRepository<Subscription>, ISubscriptionRepository
{
    public SubscriptionRepository(MongoDbContext context) : base(context, "subscriptions") { }

    public async Task<Subscription?> GetActiveSubscriptionByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _collection.Find(s => s.UserId == userId && s.Status == "Active" && s.CurrentPeriodEnd > now && !s.IsDeleted).FirstOrDefaultAsync(cancellationToken);
    }
}

public class AuditLogRepository : BaseRepository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(MongoDbContext context) : base(context, "audit_logs") { }

    public async Task<PagedResult<AuditLog>> GetLogsPagedAsync(int pageNumber, int pageSize, string? action = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(action))
        {
            return await GetPagedAsync(_ => true, pageNumber, pageSize, l => l.Timestamp, isDescending: true, cancellationToken: cancellationToken);
        }

        return await GetPagedAsync(l => l.Action == action, pageNumber, pageSize, l => l.Timestamp, isDescending: true, cancellationToken: cancellationToken);
    }
}

public class ModerationReportRepository : BaseRepository<ModerationReport>, IModerationReportRepository
{
    public ModerationReportRepository(MongoDbContext context) : base(context, "moderation_reports") { }

    public async Task<PagedResult<ModerationReport>> GetReportsPagedAsync(ReportStatus? status, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        if (!status.HasValue)
        {
            return await GetPagedAsync(r => !r.IsDeleted, pageNumber, pageSize, r => r.CreatedAt, isDescending: true, cancellationToken: cancellationToken);
        }

        return await GetPagedAsync(r => r.Status == status.Value && !r.IsDeleted, pageNumber, pageSize, r => r.CreatedAt, isDescending: true, cancellationToken: cancellationToken);
    }
}
