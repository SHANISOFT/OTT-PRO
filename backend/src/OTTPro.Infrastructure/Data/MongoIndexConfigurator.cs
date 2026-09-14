using MongoDB.Driver;
using OTTPro.Domain.Entities;

namespace OTTPro.Infrastructure.Data;

public static class MongoIndexConfigurator
{
    public static async Task ConfigureIndexesAsync(MongoDbContext context)
    {
        try
        {
            // 1. Users Indexes
            var userBuilder = Builders<User>.IndexKeys;
            await context.Users.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<User>(userBuilder.Ascending(u => u.Username), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<User>(userBuilder.Ascending(u => u.Email), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<User>(userBuilder.Ascending(u => u.Status).Descending(u => u.CreatedAt))
            });

            // 2. Refresh Tokens (TTL index on expiresAt)
            var tokenBuilder = Builders<RefreshToken>.IndexKeys;
            await context.RefreshTokens.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<RefreshToken>(tokenBuilder.Ascending(t => t.TokenHash), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<RefreshToken>(tokenBuilder.Ascending(t => t.UserId)),
                new CreateIndexModel<RefreshToken>(tokenBuilder.Ascending(t => t.ExpiresAt), new CreateIndexOptions { ExpireAfter = TimeSpan.Zero })
            });

            // 3. Shows Indexes
            var showBuilder = Builders<Show>.IndexKeys;
            await context.Shows.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<Show>(showBuilder.Ascending(s => s.Slug), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<Show>(showBuilder.Ascending("genres").Descending("ratingSummary.averageRating")),
                new CreateIndexModel<Show>(showBuilder.Descending(s => s.ReleaseDate)),
                new CreateIndexModel<Show>(showBuilder.Text(s => s.Title).Text(s => s.Overview))
            });

            // 4. Movies Indexes
            var movieBuilder = Builders<Movie>.IndexKeys;
            await context.Movies.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<Movie>(movieBuilder.Ascending(m => m.Slug), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<Movie>(movieBuilder.Ascending("genres").Descending("ratingSummary.averageRating")),
                new CreateIndexModel<Movie>(movieBuilder.Descending(m => m.ReleaseDate)),
                new CreateIndexModel<Movie>(movieBuilder.Text(m => m.Title).Text(m => m.Overview))
            });

            // 5. Watchlists Indexes
            var watchlistBuilder = Builders<WatchlistItem>.IndexKeys;
            await context.Watchlists.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<WatchlistItem>(watchlistBuilder.Ascending(w => w.UserId).Ascending(w => w.MediaType).Ascending(w => w.MediaId), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<WatchlistItem>(watchlistBuilder.Ascending(w => w.UserId).Ascending(w => w.Status).Descending(w => w.UpdatedAt))
            });

            // 6. Follows Indexes
            var followBuilder = Builders<Follow>.IndexKeys;
            await context.Follows.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<Follow>(followBuilder.Ascending(f => f.FollowerId).Ascending(f => f.FolloweeId), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<Follow>(followBuilder.Ascending(f => f.FolloweeId).Descending(f => f.CreatedAt)),
                new CreateIndexModel<Follow>(followBuilder.Ascending(f => f.FollowerId).Descending(f => f.CreatedAt))
            });

            // 7. Notifications Indexes (TTL 90 days)
            var notifBuilder = Builders<Notification>.IndexKeys;
            await context.Notifications.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<Notification>(notifBuilder.Ascending(n => n.RecipientId).Ascending(n => n.IsRead).Descending(n => n.CreatedAt)),
                new CreateIndexModel<Notification>(notifBuilder.Ascending(n => n.CreatedAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(90) })
            });

            // 8. Watch Parties
            var partyBuilder = Builders<WatchParty>.IndexKeys;
            await context.WatchParties.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<WatchParty>(partyBuilder.Ascending(p => p.RoomCode), new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<WatchParty>(partyBuilder.Ascending(p => p.Status).Ascending(p => p.IsPrivate).Descending(p => p.CreatedAt))
            });

            // 9. Chat Messages (TTL 7 days)
            var chatBuilder = Builders<ChatMessage>.IndexKeys;
            await context.ChatMessages.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<ChatMessage>(chatBuilder.Ascending(c => c.PartyId).Descending(c => c.Id)),
                new CreateIndexModel<ChatMessage>(chatBuilder.Ascending(c => c.CreatedAt), new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(7) })
            });

            // 10. Poll Votes (Unique per poll + user)
            var voteBuilder = Builders<PollVote>.IndexKeys;
            await context.PollVotes.Indexes.CreateOneAsync(
                new CreateIndexModel<PollVote>(voteBuilder.Ascending(v => v.PollId).Ascending(v => v.UserId), new CreateIndexOptions { Unique = true })
            );
        }
        catch
        {
            // Fail safely if database is offline during startup/testing
        }
    }
}
