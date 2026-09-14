using MongoDB.Driver;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;
using OTTPro.Infrastructure.Data;

namespace OTTPro.Infrastructure.Repositories;

public class WatchlistRepository : BaseRepository<WatchlistItem>, IWatchlistRepository
{
    public WatchlistRepository(MongoDbContext context) : base(context, "watchlists") { }

    public async Task<WatchlistItem?> GetUserItemAsync(string userId, MediaType mediaType, string mediaId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<WatchlistItem>.Filter.And(
            Builders<WatchlistItem>.Filter.Eq(w => w.UserId, userId),
            Builders<WatchlistItem>.Filter.Eq(w => w.MediaType, mediaType),
            Builders<WatchlistItem>.Filter.Eq(w => w.MediaId, mediaId),
            Builders<WatchlistItem>.Filter.Eq(w => w.IsDeleted, false)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WatchlistItem>> GetUserWatchlistAsync(string userId, WatchStatus? status = null, CancellationToken cancellationToken = default)
    {
        var filterBuilder = Builders<WatchlistItem>.Filter;
        var filter = filterBuilder.And(
            filterBuilder.Eq(w => w.UserId, userId),
            filterBuilder.Eq(w => w.IsDeleted, false)
        );

        if (status.HasValue)
        {
            filter = filterBuilder.And(filter, filterBuilder.Eq(w => w.Status, status.Value));
        }

        return await _collection.Find(filter).SortByDescending(w => w.UpdatedAt).ToListAsync(cancellationToken);
    }
}

public class ReviewRepository : BaseRepository<Review>, IReviewRepository
{
    public ReviewRepository(MongoDbContext context) : base(context, "reviews") { }

    public async Task<PagedResult<Review>> GetMediaReviewsAsync(MediaType mediaType, string mediaId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        return await GetPagedAsync(
            r => r.MediaType == mediaType && r.MediaId == mediaId,
            pageNumber,
            pageSize,
            r => r.UpvoteCount,
            isDescending: true,
            cancellationToken: cancellationToken
        );
    }

    public async Task<Review?> GetUserMediaReviewAsync(string userId, MediaType mediaType, string mediaId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Review>.Filter.And(
            Builders<Review>.Filter.Eq(r => r.UserId, userId),
            Builders<Review>.Filter.Eq(r => r.MediaType, mediaType),
            Builders<Review>.Filter.Eq(r => r.MediaId, mediaId),
            Builders<Review>.Filter.Eq(r => r.IsDeleted, false)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }
}

public class PostRepository : BaseRepository<Post>, IPostRepository
{
    public PostRepository(MongoDbContext context) : base(context, "posts") { }

    public async Task<CursorPagedResult<Post>> GetFeedPostsAsync(List<string> followedUserIds, string? cursorId, int limit, CancellationToken cancellationToken = default)
    {
        // If user follows people, show their posts + popular public posts
        if (followedUserIds.Count > 0)
        {
            return await GetCursorPagedAsync(
                p => followedUserIds.Contains(p.UserId) && p.Status == "Published",
                cursorId,
                limit,
                isDescending: true,
                cancellationToken: cancellationToken
            );
        }

        // Global trending feed
        return await GetCursorPagedAsync(
            p => p.Status == "Published",
            cursorId,
            limit,
            isDescending: true,
            cancellationToken: cancellationToken
        );
    }

    public async Task<CursorPagedResult<Post>> GetUserPostsAsync(string userId, string? cursorId, int limit, CancellationToken cancellationToken = default)
    {
        return await GetCursorPagedAsync(
            p => p.UserId == userId && p.Status == "Published",
            cursorId,
            limit,
            isDescending: true,
            cancellationToken: cancellationToken
        );
    }
}

public class CommentRepository : BaseRepository<Comment>, ICommentRepository
{
    public CommentRepository(MongoDbContext context) : base(context, "comments") { }

    public async Task<PagedResult<Comment>> GetCommentsForTargetAsync(string targetType, string targetId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        return await GetPagedAsync(
            c => c.TargetType == targetType && c.TargetId == targetId,
            pageNumber,
            pageSize,
            c => c.CreatedAt,
            isDescending: false,
            cancellationToken: cancellationToken
        );
    }
}

public class FollowRepository : BaseRepository<Follow>, IFollowRepository
{
    public FollowRepository(MongoDbContext context) : base(context, "follows") { }

    public async Task<bool> IsFollowingAsync(string followerId, string followeeId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Follow>.Filter.And(
            Builders<Follow>.Filter.Eq(f => f.FollowerId, followerId),
            Builders<Follow>.Filter.Eq(f => f.FolloweeId, followeeId)
        );
        return await _collection.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<List<string>> GetFollowingIdsAsync(string followerId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Follow>.Filter.Eq(f => f.FollowerId, followerId);
        var follows = await _collection.Find(filter).ToListAsync(cancellationToken);
        return follows.Select(f => f.FolloweeId).ToList();
    }
}

public class NotificationRepository : BaseRepository<Notification>, INotificationRepository
{
    public NotificationRepository(MongoDbContext context) : base(context, "notifications") { }

    public async Task<CursorPagedResult<Notification>> GetUserNotificationsAsync(string userId, string? cursorId, int limit, CancellationToken cancellationToken = default)
    {
        return await GetCursorPagedAsync(
            n => n.RecipientId == userId,
            cursorId,
            limit,
            isDescending: true,
            cancellationToken: cancellationToken
        );
    }

    public async Task MarkAllReadAsync(string userId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.RecipientId, userId),
            Builders<Notification>.Filter.Eq(n => n.IsRead, false)
        );
        var update = Builders<Notification>.Update
            .Set(n => n.IsRead, true)
            .Set(n => n.UpdatedAt, DateTime.UtcNow);

        await _collection.UpdateManyAsync(filter, update, cancellationToken: cancellationToken);
    }
}

public class WatchPartyRepository : BaseRepository<WatchParty>, IWatchPartyRepository
{
    public WatchPartyRepository(MongoDbContext context) : base(context, "watch_parties") { }

    public async Task<WatchParty?> GetByRoomCodeAsync(string roomCode, CancellationToken cancellationToken = default)
    {
        var filter = Builders<WatchParty>.Filter.And(
            Builders<WatchParty>.Filter.Eq(p => p.RoomCode, roomCode.ToUpperInvariant()),
            Builders<WatchParty>.Filter.Eq(p => p.IsDeleted, false)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }
}
