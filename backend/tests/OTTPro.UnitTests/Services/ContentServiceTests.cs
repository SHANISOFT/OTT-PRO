using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using OTTPro.Application.Common.Exceptions;
using OTTPro.Application.DTOs.Content;
using OTTPro.Application.Interfaces.Infrastructure;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Services;
using OTTPro.Domain.Entities;
using Xunit;

namespace OTTPro.UnitTests.Services;

public class ContentServiceTests
{
    private readonly Mock<IContentRepository> _contentRepoMock = new();
    private readonly Mock<ICacheService> _cacheMock = new();
    private readonly Mock<ILogger<ContentService>> _loggerMock = new();
    private readonly ContentService _sut;

    public ContentServiceTests()
    {
        _sut = new ContentService(_contentRepoMock.Object, _cacheMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetTrendingContentAsync_WhenCacheHit_ReturnsCachedObjectImmediately()
    {
        // Arrange
        var cached = new DiscoveryResponseDto
        {
            TrendingShows = new List<ContentCardDto> { new() { Title = "Cached Show", Slug = "cached-show" } }
        };

        _cacheMock.Setup(c => c.GetAsync<DiscoveryResponseDto>("discovery:trending", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cached);

        // Act
        var result = await _sut.GetTrendingContentAsync();

        // Assert
        result.Should().NotBeNull();
        result.TrendingShows.Should().HaveCount(1);
        result.TrendingShows[0].Title.Should().Be("Cached Show");

        _contentRepoMock.Verify(r => r.GetTrendingShowsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetTrendingContentAsync_WhenCacheMiss_QueriesRepositoryAndPopulatesCache()
    {
        // Arrange
        _cacheMock.Setup(c => c.GetAsync<DiscoveryResponseDto>("discovery:trending", It.IsAny<CancellationToken>()))
            .ReturnsAsync((DiscoveryResponseDto?)null);

        var shows = new List<Show>
        {
            new() { Title = "Severance", Slug = "severance", RatingSummary = new RatingSummary { AverageRating = 8.7 } }
        };
        var movies = new List<Movie>
        {
            new() { Title = "Interstellar", Slug = "interstellar", RatingSummary = new RatingSummary { AverageRating = 8.7 } }
        };

        _contentRepoMock.Setup(r => r.GetTrendingShowsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(shows);
        _contentRepoMock.Setup(r => r.GetTrendingMoviesAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(movies);

        // Act
        var result = await _sut.GetTrendingContentAsync();

        // Assert
        result.Should().NotBeNull();
        result.TrendingShows.Should().HaveCount(1);
        result.PopularMovies.Should().HaveCount(1);

        _cacheMock.Verify(c => c.SetAsync("discovery:trending", It.IsAny<DiscoveryResponseDto>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetShowBySlugAsync_WhenNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _contentRepoMock.Setup(r => r.GetShowBySlugAsync("non-existent", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Show?)null);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => _sut.GetShowBySlugAsync("non-existent"));
    }
}
