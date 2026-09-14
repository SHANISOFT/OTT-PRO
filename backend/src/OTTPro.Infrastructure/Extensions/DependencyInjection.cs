using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OTTPro.Application.Interfaces.Infrastructure;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Application.Interfaces.Services;
using OTTPro.Application.Services;
using OTTPro.Application.Validators;
using OTTPro.Infrastructure.Caching;
using OTTPro.Infrastructure.Data;
using OTTPro.Infrastructure.Repositories;
using OTTPro.Infrastructure.Security;

namespace OTTPro.Infrastructure.Extensions;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. MongoDb Configuration
        services.Configure<MongoDbSettings>(configuration.GetSection("MongoDb"));
        services.AddSingleton<MongoDbContext>();

        // 2. Repositories
        services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IContentRepository, ContentRepository>();
        services.AddScoped<IWatchlistRepository, WatchlistRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IPostRepository, PostRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<IFollowRepository, FollowRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IWatchPartyRepository, WatchPartyRepository>();
        services.AddScoped<IPollRepository, PollRepository>();
        services.AddScoped<IUserSessionRepository, UserSessionRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IModerationReportRepository, ModerationReportRepository>();

        // 3. Security Services
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITokenService, TokenService>();

        // 4. Caching Services
        services.AddSingleton<ICacheService, RedisCacheService>();

        // 5. Legal Streaming Providers
        services.AddSingleton<IStreamingProvider, OTTPro.Infrastructure.Streaming.YouTubeStreamingProvider>();
        services.AddSingleton<IStreamingProvider>(sp => new OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider("netflix", "Netflix", "https://www.netflix.com", sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider>>()));
        services.AddSingleton<IStreamingProvider>(sp => new OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider("hotstar", "JioHotstar", "https://www.hotstar.com", sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider>>()));
        services.AddSingleton<IStreamingProvider>(sp => new OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider("prime", "Prime Video", "https://www.primevideo.com", sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider>>()));
        services.AddSingleton<IStreamingProvider>(sp => new OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider("sonyliv", "SonyLIV", "https://www.sonyliv.com", sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider>>()));
        services.AddSingleton<IStreamingProvider>(sp => new OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider("zee5", "Zee5", "https://www.zee5.com", sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<OTTPro.Infrastructure.Streaming.PartnerOttStreamingProvider>>()));
        services.AddScoped<IStreamingService, OTTPro.Infrastructure.Streaming.StreamingService>();

        // 6. Application Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IContentService, ContentService>();

        // 6. FluentValidation
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        return services;
    }
}
