using Microsoft.Extensions.Logging;
using Moq;
using OTTPro.Application.Common.Exceptions;
using OTTPro.Application.DTOs.Streaming;
using OTTPro.Application.Interfaces.Services;
using OTTPro.Infrastructure.Streaming;
using Xunit;

namespace OTTPro.UnitTests.Services;

public class StreamingServiceTests
{
    private readonly Mock<ILogger<StreamingService>> _loggerMock;
    private readonly Mock<IStreamingProvider> _providerMock;

    public StreamingServiceTests()
    {
        _loggerMock = new Mock<ILogger<StreamingService>>();
        _providerMock = new Mock<IStreamingProvider>();
        _providerMock.Setup(p => p.ProviderId).Returns("youtube");
        _providerMock.Setup(p => p.DisplayName).Returns("YouTube Embed");
        _providerMock.Setup(p => p.IntegrationModel).Returns("EmbeddedPlayer");
        _providerMock.Setup(p => p.IsProviderAvailableAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _providerMock.Setup(p => p.ValidateUserEntitlementAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
    }

    [Fact]
    public void GetAvailableProviders_ReturnsRegisteredProviders()
    {
        // Arrange
        var service = new StreamingService(new[] { _providerMock.Object }, _loggerMock.Object);

        // Act
        var providers = service.GetAvailableProviders();

        // Assert
        Assert.Single(providers);
        Assert.Equal("youtube", providers[0].ProviderId);
        Assert.Equal("YouTube Embed", providers[0].DisplayName);
        Assert.True(providers[0].IsAvailable);
    }

    [Fact]
    public async Task InitializePlaybackSessionAsync_ValidProvider_ReturnsSession()
    {
        // Arrange
        var expectedSession = new PlaybackSessionDto
        {
            SessionId = "sess-123",
            ProviderId = "youtube",
            ContentId = "video-456",
            EmbedUrl = "https://youtube.com/embed/video-456",
            IsUserEntitled = true
        };
        _providerMock.Setup(p => p.CreatePlaybackSessionAsync("user1", "video-456", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSession);

        var service = new StreamingService(new[] { _providerMock.Object }, _loggerMock.Object);

        // Act
        var result = await service.InitializePlaybackSessionAsync("user1", "youtube", "video-456");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("sess-123", result.SessionId);
        Assert.Equal("video-456", result.ContentId);
        Assert.True(result.IsUserEntitled);
    }

    [Fact]
    public async Task InitializePlaybackSessionAsync_UnknownProvider_ThrowsNotFoundException()
    {
        // Arrange
        var service = new StreamingService(new[] { _providerMock.Object }, _loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.InitializePlaybackSessionAsync("user1", "unknown_provider", "content-123"));
    }

    [Fact]
    public async Task CheckPlaybackStateAsync_ValidProvider_ReturnsState()
    {
        // Arrange
        var expectedState = new PlaybackStateDto
        {
            SessionId = "sess-123",
            State = "Playing",
            CurrentPositionSeconds = 45.5,
            IsEntitled = true
        };
        _providerMock.Setup(p => p.GetPlaybackStateAsync("sess-123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedState);

        var service = new StreamingService(new[] { _providerMock.Object }, _loggerMock.Object);

        // Act
        var result = await service.CheckPlaybackStateAsync("youtube", "sess-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Playing", result.State);
        Assert.Equal(45.5, result.CurrentPositionSeconds);
    }
}
