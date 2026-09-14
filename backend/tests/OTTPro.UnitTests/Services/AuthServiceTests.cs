using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using OTTPro.Application.Common.Exceptions;
using OTTPro.Application.DTOs.Auth;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Security;
using OTTPro.Application.Services;
using OTTPro.Domain.Entities;
using OTTPro.Domain.Enums;
using Xunit;

namespace OTTPro.UnitTests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IRefreshTokenRepository> _tokenRepoMock = new();
    private readonly Mock<ITokenService> _tokenServiceMock = new();
    private readonly Mock<IPasswordHasher> _hasherMock = new();
    private readonly Mock<ILogger<AuthService>> _loggerMock = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(
            _userRepoMock.Object,
            _tokenRepoMock.Object,
            _tokenServiceMock.Object,
            _hasherMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task RegisterAsync_WithUniqueCredentials_ReturnsTokensAndCreatesUser()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Username = "moviebuff",
            Email = "buff@cinema.com",
            Password = "SecurePassword123!",
            FullName = "Movie Buff"
        };

        _userRepoMock.Setup(r => r.UsernameExistsAsync("moviebuff", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _userRepoMock.Setup(r => r.EmailExistsAsync("buff@cinema.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _hasherMock.Setup(h => h.HashPassword(request.Password))
            .Returns("hashed_pwd");
        _tokenServiceMock.Setup(t => t.GenerateAccessToken(It.IsAny<User>()))
            .Returns(("jwt_token", "jwt_id", DateTime.UtcNow.AddMinutes(15)));
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken())
            .Returns("refresh_raw_token");
        _tokenServiceMock.Setup(t => t.HashToken("refresh_raw_token"))
            .Returns("refresh_hashed_token");

        // Act
        var result = await _sut.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("jwt_token");
        result.RefreshToken.Should().Be("refresh_raw_token");
        result.User.Username.Should().Be("moviebuff");
        result.User.Email.Should().Be("buff@cinema.com");

        _userRepoMock.Verify(r => r.CreateAsync(It.Is<User>(u => u.Username == "moviebuff" && u.PasswordHash == "hashed_pwd"), It.IsAny<CancellationToken>()), Times.Once);
        _tokenRepoMock.Verify(r => r.CreateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WhenUsernameExists_ThrowsConflictException()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Username = "existing_user",
            Email = "new@test.com",
            Password = "Password123!",
            FullName = "Test User"
        };

        _userRepoMock.Setup(r => r.UsernameExistsAsync("existing_user", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => _sut.RegisterAsync(request));
    }

    [Fact]
    public async Task LoginAsync_WithValidPassword_ReturnsAuthResponse()
    {
        // Arrange
        var request = new LoginRequest
        {
            EmailOrUsername = "cinema_fan",
            Password = "CorrectPassword123!"
        };

        var existingUser = new User
        {
            Username = "cinema_fan",
            Email = "fan@test.com",
            PasswordHash = "stored_hash",
            Status = UserStatus.Active
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync("cinema_fan", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        _userRepoMock.Setup(r => r.GetByUsernameAsync("cinema_fan", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);
        _hasherMock.Setup(h => h.VerifyPassword("CorrectPassword123!", "stored_hash"))
            .Returns(true);
        _tokenServiceMock.Setup(t => t.GenerateAccessToken(existingUser))
            .Returns(("access_token", "jwt_id", DateTime.UtcNow.AddMinutes(15)));
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken())
            .Returns("new_refresh_token");

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("access_token");
        result.RefreshToken.Should().Be("new_refresh_token");
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsUnauthorizedException()
    {
        // Arrange
        var request = new LoginRequest
        {
            EmailOrUsername = "cinema_fan",
            Password = "WrongPassword!"
        };

        var existingUser = new User
        {
            Username = "cinema_fan",
            PasswordHash = "stored_hash",
            Status = UserStatus.Active
        };

        _userRepoMock.Setup(r => r.GetByUsernameAsync("cinema_fan", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);
        _hasherMock.Setup(h => h.VerifyPassword("WrongPassword!", "stored_hash"))
            .Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() => _sut.LoginAsync(request));
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenTokenIsReusedOrRevoked_RevokesAllSessionsAndThrows()
    {
        // Arrange
        var request = new RefreshTokenRequest { RefreshToken = "replayed_token" };
        _tokenServiceMock.Setup(t => t.HashToken("replayed_token")).Returns("hashed_replayed");

        var revokedToken = new RefreshToken
        {
            UserId = "user123",
            TokenHash = "hashed_replayed",
            IsRevoked = true,
            ExpiresAt = DateTime.UtcNow.AddDays(2)
        };

        _tokenRepoMock.Setup(r => r.GetByTokenHashAsync("hashed_replayed", It.IsAny<CancellationToken>()))
            .ReturnsAsync(revokedToken);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() => _sut.RefreshTokenAsync(request));
        _tokenRepoMock.Verify(r => r.RevokeAllUserTokensAsync("user123", It.IsAny<CancellationToken>()), Times.Once);
    }
}
