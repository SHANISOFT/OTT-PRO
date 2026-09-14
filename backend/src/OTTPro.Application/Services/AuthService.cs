using Microsoft.Extensions.Logging;
using OTTPro.Application.Common.Exceptions;
using OTTPro.Application.DTOs.Auth;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Application.Interfaces.Services;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;

namespace OTTPro.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService,
        IPasswordHasher passwordHasher,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _userRepository.UsernameExistsAsync(normalizedUsername, cancellationToken))
        {
            throw new ConflictException("Username is already taken by another cinephile.");
        }

        if (await _userRepository.EmailExistsAsync(normalizedEmail, cancellationToken))
        {
            throw new ConflictException("Email is already registered.");
        }

        var user = new User
        {
            Username = normalizedUsername,
            Email = normalizedEmail,
            FullName = request.FullName.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Roles = new List<string> { nameof(UserRole.User) },
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateAsync(user, cancellationToken);
        _logger.LogInformation("New user registered successfully: {UserId} ({Username})", user.Id, user.Username);

        return await GenerateAuthResponseAsync(user, ipAddress, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var identifier = request.EmailOrUsername.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(identifier, cancellationToken)
                   ?? await _userRepository.GetByUsernameAsync(identifier, cancellationToken);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for identifier: {Identifier}", identifier);
            throw new UnauthorizedException("Invalid username/email or password.");
        }

        if (user.Status == UserStatus.Banned)
        {
            throw new ForbiddenException("Your account has been banned due to violations of community guidelines.");
        }

        if (user.Status == UserStatus.Suspended)
        {
            throw new ForbiddenException("Your account has been temporarily suspended.");
        }

        _logger.LogInformation("User logged in: {UserId} ({Username})", user.Id, user.Username);
        return await GenerateAuthResponseAsync(user, ipAddress, cancellationToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var incomingHash = _tokenService.HashToken(request.RefreshToken);
        var existingToken = await _refreshTokenRepository.GetByTokenHashAsync(incomingHash, cancellationToken);

        if (existingToken == null)
        {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        // Detect Token Replay / Theft: if already revoked, revoke all tokens for this user!
        if (existingToken.IsRevoked)
        {
            _logger.LogWarning("Token replay detected for user {UserId}! Revoking all sessions.", existingToken.UserId);
            await _refreshTokenRepository.RevokeAllUserTokensAsync(existingToken.UserId, cancellationToken);
            throw new UnauthorizedException("Invalid or compromised refresh token session. Please log in again.");
        }

        if (existingToken.IsExpired)
        {
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        var user = await _userRepository.GetByIdAsync(existingToken.UserId, cancellationToken);
        if (user == null || user.Status != UserStatus.Active)
        {
            throw new UnauthorizedException("User account is inactive or not found.");
        }

        // Rotate Refresh Token
        var newRefreshTokenString = _tokenService.GenerateRefreshToken();
        var newRefreshTokenHash = _tokenService.HashToken(newRefreshTokenString);

        existingToken.IsRevoked = true;
        existingToken.ReplacedByTokenHash = newRefreshTokenHash;
        existingToken.UpdatedAt = DateTime.UtcNow;
        await _refreshTokenRepository.UpdateAsync(existingToken, cancellationToken);

        var (accessToken, jwtId, expiresAt) = _tokenService.GenerateAccessToken(user);

        var newRefreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = newRefreshTokenHash,
            JwtId = jwtId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedFromIp = ipAddress,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepository.CreateAsync(newRefreshToken, cancellationToken);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshTokenString,
            AccessTokenExpiresAt = expiresAt,
            User = MapToProfileResponse(user)
        };
    }

    public async Task RevokeTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.HashToken(refreshToken);
        var token = await _refreshTokenRepository.GetByTokenHashAsync(tokenHash, cancellationToken);
        if (token != null)
        {
            token.IsRevoked = true;
            token.UpdatedAt = DateTime.UtcNow;
            await _refreshTokenRepository.UpdateAsync(token, cancellationToken);
        }
    }

    public async Task<UserProfileResponse> GetCurrentUserProfileAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User", userId);
        }

        return MapToProfileResponse(user);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user, string? ipAddress, CancellationToken cancellationToken)
    {
        var (accessToken, jwtId, expiresAt) = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var hashedRefreshToken = _tokenService.HashToken(rawRefreshToken);

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hashedRefreshToken,
            JwtId = jwtId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedFromIp = ipAddress,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepository.CreateAsync(refreshTokenEntity, cancellationToken);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            AccessTokenExpiresAt = expiresAt,
            User = MapToProfileResponse(user)
        };
    }

    private static UserProfileResponse MapToProfileResponse(User user)
    {
        return new UserProfileResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            BannerUrl = user.BannerUrl,
            Roles = user.Roles,
            FollowersCount = user.Stats.FollowersCount,
            FollowingCount = user.Stats.FollowingCount,
            ReviewsCount = user.Stats.ReviewsCount,
            WatchTimeMinutes = user.Stats.WatchTimeMinutes,
            CreatedAt = user.CreatedAt
        };
    }
}
