using OTTPro.Application.Common.Models;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;

namespace OTTPro.Application.Interfaces.Repositories;

public interface IPollRepository : IBaseRepository<Poll>
{
    Task<IReadOnlyList<Poll>> GetActivePollsAsync(string? showId = null, string? roomId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PollOption>> GetOptionsByPollIdAsync(string pollId, CancellationToken cancellationToken = default);
    Task<PollOption?> GetOptionByIdAsync(string optionId, CancellationToken cancellationToken = default);
    Task<bool> HasUserVotedAsync(string pollId, string userId, CancellationToken cancellationToken = default);
    Task RecordVoteAsync(PollVote vote, CancellationToken cancellationToken = default);
    Task IncrementOptionVoteCountAsync(string optionId, string pollId, CancellationToken cancellationToken = default);
    Task CreateOptionAsync(PollOption option, CancellationToken cancellationToken = default);
}

public interface IUserSessionRepository : IBaseRepository<UserSession>
{
    Task<IReadOnlyList<UserSession>> GetActiveSessionsByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<UserSession?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task RevokeSessionAsync(string sessionId, CancellationToken cancellationToken = default);
    Task RevokeAllSessionsExceptCurrentAsync(string userId, string currentSessionId, CancellationToken cancellationToken = default);
}

public interface ISubscriptionRepository : IBaseRepository<Subscription>
{
    Task<Subscription?> GetActiveSubscriptionByUserIdAsync(string userId, CancellationToken cancellationToken = default);
}

public interface IAuditLogRepository : IBaseRepository<AuditLog>
{
    Task<PagedResult<AuditLog>> GetLogsPagedAsync(int pageNumber, int pageSize, string? action = null, CancellationToken cancellationToken = default);
}

public interface IModerationReportRepository : IBaseRepository<ModerationReport>
{
    Task<PagedResult<ModerationReport>> GetReportsPagedAsync(ReportStatus? status, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}
