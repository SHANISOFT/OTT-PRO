using OTTPro.Application.Common.Models;
using OTTPro.Application.DTOs.Content;

namespace OTTPro.Application.Interfaces.Services;

public interface IContentService
{
    Task<DiscoveryResponseDto> GetTrendingContentAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<ContentCardDto>> GetShowsPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default);
    Task<PagedResult<ContentCardDto>> GetMoviesPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default);
    Task<ShowDetailsDto> GetShowBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<MovieDetailsDto> GetMovieBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EpisodeDto>> GetEpisodesBySeasonAsync(string showId, int seasonNumber, CancellationToken cancellationToken = default);
    Task<List<ContentCardDto>> SearchAsync(string query, CancellationToken cancellationToken = default);
    Task<int> SeedCatalogIfEmptyAsync(CancellationToken cancellationToken = default);
}
