using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OTTPro.API.Extensions;
using OTTPro.API.Hubs;
using OTTPro.API.Middleware;
using OTTPro.API.Services;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Infrastructure.Data;
using OTTPro.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 1. Core Services & DI
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// 2. Clean Architecture Infrastructure & Application Services
builder.Services.AddInfrastructureServices(builder.Configuration);

// 3. JWT Authentication Setup
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "OTTPRO_ULTRA_SECURE_SUPER_SECRET_KEY_FOR_JWT_SIGNING_2026_CHANGE_IN_PROD!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "OTTProAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "OTTProClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. CORS Policy for Angular Frontend
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:4200", "https://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 5. OpenAPI / Swagger Documentation
builder.Services.AddSwaggerDocumentation();

var app = builder.Build();

// 6. Global Middlewares
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "OTT PRO API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<WatchPartyHub>("/hubs/watchparty");
app.MapHub<ChatHub>("/hubs/chat");

// 7. Initialize MongoDB Indexes Asynchronously
_ = Task.Run(async () =>
{
    using var scope = app.Services.CreateScope();
    var mongoContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await MongoIndexConfigurator.ConfigureIndexesAsync(mongoContext);
});

app.Run();
