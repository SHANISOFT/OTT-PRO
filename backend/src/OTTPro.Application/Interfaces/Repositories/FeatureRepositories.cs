using OTTPro.Application.Common.Models;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;

namespace OTTPro.Application.Interfaces.Repositories;

public interface IUserRepository : IBaseRepository<User>
{
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task UpdateStatsAsync(string userId, int followerDelta, int followingDelta, int reviewDelta, long watchTimeDelta, CancellationToken cancellationToken = default);
}

public interface IRefreshTokenRepository : IBaseRepository<RefreshToken>
{
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);
    Task RevokeAllUserTokensAsync(string userId, CancellationToken cancellationToken = default);
}

public interface IContentRepository
{
    Task<Show?> GetShowByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<Show?> GetShowBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<Movie?> GetMovieByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<Movie?> GetMovieBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<PagedResult<Show>> GetShowsPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default);
    Task<PagedResult<Movie>> GetMoviesPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Show>> GetTrendingShowsAsync(int limit = 10, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Movie>> GetTrendingMoviesAsync(int limit = 10, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Season>> GetSeasonsByShowIdAsync(string showId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Episode>> GetEpisodesBySeasonAsync(string showId, int seasonNumber, CancellationToken cancellationToken = default);
    Task<List<object>> SearchContentAsync(string query, int limit = 10, CancellationToken cancellationToken = default);
    Task<long> CountShowsAsync(CancellationToken cancellationToken = default);
    Task CreateShowAsync(Show show, CancellationToken cancellationToken = default);
    Task CreateMovieAsync(Movie movie, CancellationToken cancellationToken = default);
    Task CreateSeasonAsync(Season season, CancellationToken cancellationToken = default);
    Task CreateEpisodeAsync(Episode episode, CancellationToken cancellationToken = default);
}

public interface IWatchlistRepository : IBaseRepository<WatchlistItem>
{
    Task<WatchlistItem?> GetUserItemAsync(string userId, MediaType mediaType, string mediaId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WatchlistItem>> GetUserWatchlistAsync(string userId, WatchStatus? status = null, CancellationToken cancellationToken = default);
}

public interface IReviewRepository : IBaseRepository<Review>
{
    Task<PagedResult<Review>> GetMediaReviewsAsync(MediaType mediaType, string mediaId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<Review?> GetUserMediaReviewAsync(string userId, MediaType mediaType, string mediaId, CancellationToken cancellationToken = default);
}

public interface IPostRepository : IBaseRepository<Post>
{
    Task<CursorPagedResult<Post>> GetFeedPostsAsync(List<string> followedUserIds, string? cursorId, int limit, CancellationToken cancellationToken = default);
    Task<CursorPagedResult<Post>> GetUserPostsAsync(string userId, string? cursorId, int limit, CancellationToken cancellationToken = default);
}

public interface ICommentRepository : IBaseRepository<Comment>
{
    Task<PagedResult<Comment>> GetCommentsForTargetAsync(string targetType, string targetId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}

public interface IFollowRepository : IBaseRepository<Follow>
{
    Task<bool> IsFollowingAsync(string followerId, string followeeId, CancellationToken cancellationToken = default);
    Task<List<string>> GetFollowingIdsAsync(string followerId, CancellationToken cancellationToken = default);
}

public interface INotificationRepository : IBaseRepository<Notification>
{
    Task<CursorPagedResult<Notification>> GetUserNotificationsAsync(string userId, string? cursorId, int limit, CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(string userId, CancellationToken cancellationToken = default);
}

public interface IWatchPartyRepository : IBaseRepository<WatchParty>
{
    Task<WatchParty?> GetByRoomCodeAsync(string roomCode, CancellationToken cancellationToken = default);
}
