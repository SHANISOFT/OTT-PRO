using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Infrastructure;
using OTTPro.Infrastructure.Data;

namespace OTTPro.API.Controllers.V1;

public class HealthController : BaseApiController
{
    private readonly MongoDbContext _mongoContext;
    private readonly ICacheService _cacheService;

    public HealthController(MongoDbContext mongoContext, ICacheService cacheService)
    {
        _mongoContext = mongoContext;
        _cacheService = cacheService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> CheckHealth(CancellationToken cancellationToken)
    {
        var mongoHealthy = false;
        try
        {
            await _mongoContext.Database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: cancellationToken);
            mongoHealthy = true;
        }
        catch
        {
            mongoHealthy = false;
        }

        var cacheHealthy = false;
        try
        {
            await _cacheService.SetAsync("health_check_ping", "pong", TimeSpan.FromSeconds(10), cancellationToken);
            var result = await _cacheService.GetAsync<string>("health_check_ping", cancellationToken);
            cacheHealthy = result == "pong";
        }
        catch
        {
            cacheHealthy = false;
        }

        var healthData = new
        {
            Status = mongoHealthy ? "Healthy" : "Degraded",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            Components = new
            {
                MongoDB = mongoHealthy ? "Connected" : "Disconnected",
                Cache = cacheHealthy ? "Operational" : "FallbackActive"
            }
        };

        return OkResponse<object>(healthData, "Health status retrieved successfully.");
    }
}
