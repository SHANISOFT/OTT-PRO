using Microsoft.AspNetCore.Mvc;
using OTTPro.Application.Common.Models;
using OTTPro.Application.DTOs.Content;
using OTTPro.Application.Interfaces.Services;

namespace OTTPro.API.Controllers.V1;

public class ContentController : BaseApiController
{
    private readonly IContentService _contentService;

    public ContentController(IContentService contentService)
    {
        _contentService = contentService;
    }

    [HttpGet("discovery/trending")]
    [ProducesResponseType(typeof(ApiResponse<DiscoveryResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DiscoveryResponseDto>>> GetTrending(CancellationToken cancellationToken)
    {
        var trending = await _contentService.GetTrendingContentAsync(cancellationToken);
        return OkResponse(trending, "Trending content retrieved successfully.");
    }

    [HttpGet("shows")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ContentCardDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<ContentCardDto>>>> GetShows(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? genre = null,
        CancellationToken cancellationToken = default)
    {
        var shows = await _contentService.GetShowsPagedAsync(page, pageSize, genre, cancellationToken);
        return OkResponse(shows, "Shows retrieved successfully.");
    }

    [HttpGet("shows/{slug}")]
    [ProducesResponseType(typeof(ApiResponse<ShowDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ShowDetailsDto>>> GetShowBySlug(string slug, CancellationToken cancellationToken)
    {
        var show = await _contentService.GetShowBySlugAsync(slug, cancellationToken);
        return OkResponse(show, "Show details retrieved successfully.");
    }

    [HttpGet("shows/{showId}/seasons/{seasonNumber}/episodes")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EpisodeDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EpisodeDto>>>> GetSeasonEpisodes(
        string showId,
        int seasonNumber,
        CancellationToken cancellationToken)
    {
        var episodes = await _contentService.GetEpisodesBySeasonAsync(showId, seasonNumber, cancellationToken);
        return OkResponse(episodes, $"Episodes for Season {seasonNumber} retrieved.");
    }

    [HttpGet("movies")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ContentCardDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<ContentCardDto>>>> GetMovies(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? genre = null,
        CancellationToken cancellationToken = default)
    {
        var movies = await _contentService.GetMoviesPagedAsync(page, pageSize, genre, cancellationToken);
        return OkResponse(movies, "Movies retrieved successfully.");
    }

    [HttpGet("movies/{slug}")]
    [ProducesResponseType(typeof(ApiResponse<MovieDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MovieDetailsDto>>> GetMovieBySlug(string slug, CancellationToken cancellationToken)
    {
        var movie = await _contentService.GetMovieBySlugAsync(slug, cancellationToken);
        return OkResponse(movie, "Movie details retrieved successfully.");
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<List<ContentCardDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ContentCardDto>>>> Search(
        [FromQuery] string q,
        CancellationToken cancellationToken)
    {
        var results = await _contentService.SearchAsync(q, cancellationToken);
        return OkResponse(results, "Search results retrieved successfully.");
    }

    [HttpPost("seed")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<int>>> SeedInitialData(CancellationToken cancellationToken)
    {
        var count = await _contentService.SeedCatalogIfEmptyAsync(cancellationToken);
        return OkResponse(count, "Catalog seed executed.");
    }
}
