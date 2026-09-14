using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OTTPro.Application.Interfaces.Infrastructure;
using StackExchange.Redis;

namespace OTTPro.Infrastructure.Caching;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IDatabase? _database;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly Dictionary<string, (object Value, DateTime ExpiresAt)> _memoryFallback = new();
    private readonly object _lock = new();

    public RedisCacheService(IConfiguration configuration, ILogger<RedisCacheService> logger)
    {
        _logger = logger;
        var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379,abortConnect=false";

        try
        {
            var options = ConfigurationOptions.Parse(connectionString);
            options.AbortOnConnectFail = false;
            options.ConnectTimeout = 2000;
            _redis = ConnectionMultiplexer.Connect(options);
            if (_redis.IsConnected)
            {
                _database = _redis.GetDatabase();
                _logger.LogInformation("Successfully connected to Redis distributed cache.");
            }
            else
            {
                _logger.LogWarning("Redis is not connected. In-memory cache fallback will be used.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to initialize Redis connection. Falling back to in-memory caching.");
        }
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            if (_redis != null && _redis.IsConnected && _database != null)
            {
                var redisValue = await _database.StringGetAsync(key);
                if (!redisValue.HasValue) return default;
                return JsonSerializer.Deserialize<T>(redisValue.ToString());
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading key {Key} from Redis. Checking fallback.", key);
        }

        // Fallback
        lock (_lock)
        {
            if (_memoryFallback.TryGetValue(key, out var entry))
            {
                if (DateTime.UtcNow <= entry.ExpiresAt)
                {
                    return (T)entry.Value;
                }
                _memoryFallback.Remove(key);
            }
        }

        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        var validExpiry = expiry ?? TimeSpan.FromMinutes(30);

        try
        {
            if (_redis != null && _redis.IsConnected && _database != null)
            {
                var serialized = JsonSerializer.Serialize(value);
                await _database.StringSetAsync(key, serialized, validExpiry);
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error writing key {Key} to Redis. Storing in fallback.", key);
        }

        lock (_lock)
        {
            if (value != null)
            {
                _memoryFallback[key] = (value, DateTime.UtcNow.Add(validExpiry));
            }
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            if (_redis != null && _redis.IsConnected && _database != null)
            {
                await _database.KeyDeleteAsync(key);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deleting key {Key} from Redis.", key);
        }

        lock (_lock)
        {
            _memoryFallback.Remove(key);
        }
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            if (_redis != null && _redis.IsConnected && _database != null)
            {
                return await _database.KeyExistsAsync(key);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error checking key {Key} in Redis.", key);
        }

        lock (_lock)
        {
            if (_memoryFallback.TryGetValue(key, out var entry))
            {
                if (DateTime.UtcNow <= entry.ExpiresAt)
                    return true;
                _memoryFallback.Remove(key);
            }
        }

        return false;
    }
}
