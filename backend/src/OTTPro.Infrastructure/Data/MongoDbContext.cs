using Microsoft.Extensions.Options;
using MongoDB.Driver;
using OTTPro.Domain.Entities;

namespace OTTPro.Infrastructure.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var clientSettings = MongoClientSettings.FromConnectionString(settings.Value.ConnectionString);
        clientSettings.MaxConnectionPoolSize = 500;
        clientSettings.MinConnectionPoolSize = 20;
        clientSettings.WaitQueueTimeout = TimeSpan.FromSeconds(5);
        clientSettings.ConnectTimeout = TimeSpan.FromSeconds(10);
        clientSettings.RetryWrites = true;
        clientSettings.RetryReads = true;

        var client = new MongoClient(clientSettings);
        _database = client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<RefreshToken> RefreshTokens => _database.GetCollection<RefreshToken>("refresh_tokens");
    public IMongoCollection<Show> Shows => _database.GetCollection<Show>("shows");
    public IMongoCollection<Movie> Movies => _database.GetCollection<Movie>("movies");
    public IMongoCollection<Season> Seasons => _database.GetCollection<Season>("seasons");
    public IMongoCollection<Episode> Episodes => _database.GetCollection<Episode>("episodes");
    public IMongoCollection<WatchlistItem> Watchlists => _database.GetCollection<WatchlistItem>("watchlists");
    public IMongoCollection<WatchingProgress> WatchingProgress => _database.GetCollection<WatchingProgress>("watching_progress");
    public IMongoCollection<Rating> Ratings => _database.GetCollection<Rating>("ratings");
    public IMongoCollection<Review> Reviews => _database.GetCollection<Review>("reviews");
    public IMongoCollection<Post> Posts => _database.GetCollection<Post>("posts");
    public IMongoCollection<Comment> Comments => _database.GetCollection<Comment>("comments");
    public IMongoCollection<Follow> Follows => _database.GetCollection<Follow>("follows");
    public IMongoCollection<Notification> Notifications => _database.GetCollection<Notification>("notifications");
    public IMongoCollection<WatchParty> WatchParties => _database.GetCollection<WatchParty>("watch_parties");
    public IMongoCollection<WatchPartyMember> WatchPartyMembers => _database.GetCollection<WatchPartyMember>("watch_party_members");
    public IMongoCollection<ChatMessage> ChatMessages => _database.GetCollection<ChatMessage>("chat_messages");
    public IMongoCollection<Poll> Polls => _database.GetCollection<Poll>("polls");
    public IMongoCollection<PollOption> PollOptions => _database.GetCollection<PollOption>("poll_options");
    public IMongoCollection<PollVote> PollVotes => _database.GetCollection<PollVote>("poll_votes");
    public IMongoCollection<UserSession> UserSessions => _database.GetCollection<UserSession>("user_sessions");
    public IMongoCollection<Subscription> Subscriptions => _database.GetCollection<Subscription>("subscriptions");
    public IMongoCollection<Payment> Payments => _database.GetCollection<Payment>("payments");
    public IMongoCollection<Coupon> Coupons => _database.GetCollection<Coupon>("coupons");
    public IMongoCollection<AuditLog> AuditLogs => _database.GetCollection<AuditLog>("audit_logs");
    public IMongoCollection<ModerationReport> ModerationReports => _database.GetCollection<ModerationReport>("moderation_reports");
    public IMongoCollection<Report> Reports => _database.GetCollection<Report>("reports");
    public IMongoCollection<FriendRequest> FriendRequests => _database.GetCollection<FriendRequest>("friend_requests");
    public IMongoCollection<DirectMessage> DirectMessages => _database.GetCollection<DirectMessage>("direct_messages");

    public IMongoCollection<T> GetCollection<T>(string collectionName)
    {
        return _database.GetCollection<T>(collectionName);
    }
}
