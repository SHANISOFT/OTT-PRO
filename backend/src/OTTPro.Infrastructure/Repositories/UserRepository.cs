using MongoDB.Driver;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Domain.Entities;
using OTTPro.Infrastructure.Data;

namespace OTTPro.Infrastructure.Repositories;

public class UserRepository : BaseRepository<User>, IUserRepository
{
    public UserRepository(MongoDbContext context) : base(context, "users")
    {
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Username, username.ToLowerInvariant()),
            Builders<User>.Filter.Eq(u => u.IsDeleted, false)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Email, email.ToLowerInvariant()),
            Builders<User>.Filter.Eq(u => u.IsDeleted, false)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Username, username.ToLowerInvariant()),
            Builders<User>.Filter.Eq(u => u.IsDeleted, false)
        );
        return await _collection.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Email, email.ToLowerInvariant()),
            Builders<User>.Filter.Eq(u => u.IsDeleted, false)
        );
        return await _collection.Find(filter).AnyAsync(cancellationToken);
    }

    public async Task UpdateStatsAsync(string userId, int followerDelta, int followingDelta, int reviewDelta, long watchTimeDelta, CancellationToken cancellationToken = default)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
        var update = Builders<User>.Update
            .Inc(u => u.Stats.FollowersCount, followerDelta)
            .Inc(u => u.Stats.FollowingCount, followingDelta)
            .Inc(u => u.Stats.ReviewsCount, reviewDelta)
            .Inc(u => u.Stats.WatchTimeMinutes, watchTimeDelta)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);

        await _collection.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
    }
}

public class RefreshTokenRepository : BaseRepository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(MongoDbContext context) : base(context, "refresh_tokens")
    {
    }

    public async Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var filter = Builders<RefreshToken>.Filter.Eq(t => t.TokenHash, tokenHash);
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task RevokeAllUserTokensAsync(string userId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<RefreshToken>.Filter.And(
            Builders<RefreshToken>.Filter.Eq(t => t.UserId, userId),
            Builders<RefreshToken>.Filter.Eq(t => t.IsRevoked, false)
        );

        var update = Builders<RefreshToken>.Update
            .Set(t => t.IsRevoked, true)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        await _collection.UpdateManyAsync(filter, update, cancellationToken: cancellationToken);
    }
}
