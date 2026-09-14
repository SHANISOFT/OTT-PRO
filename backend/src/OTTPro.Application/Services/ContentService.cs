using Microsoft.Extensions.Logging;
using OTTPro.Application.Common.Exceptions;
using OTTPro.Application.Common.Models;
using OTTPro.Application.DTOs.Content;
using OTTPro.Application.Interfaces.Infrastructure;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Application.Interfaces.Services;
using OTTPro.Domain.Entities;

namespace OTTPro.Application.Services;

public class ContentService : IContentService
{
    private readonly IContentRepository _contentRepository;
    private readonly ICacheService _cacheService;
    private readonly ILogger<ContentService> _logger;

    public ContentService(
        IContentRepository contentRepository,
        ICacheService cacheService,
        ILogger<ContentService> logger)
    {
        _contentRepository = contentRepository;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<DiscoveryResponseDto> GetTrendingContentAsync(CancellationToken cancellationToken = default)
    {
        const string cacheKey = "discovery:trending";
        var cached = await _cacheService.GetAsync<DiscoveryResponseDto>(cacheKey, cancellationToken);
        if (cached != null)
        {
            return cached;
        }

        var trendingShows = await _contentRepository.GetTrendingShowsAsync(8, cancellationToken);
        var popularMovies = await _contentRepository.GetTrendingMoviesAsync(8, cancellationToken);

        var result = new DiscoveryResponseDto
        {
            TrendingShows = trendingShows.Select(MapToShowCard).ToList(),
            PopularMovies = popularMovies.Select(MapToMovieCard).ToList(),
            TopRated = trendingShows.Take(4).Select(MapToShowCard)
                .Concat(popularMovies.Take(4).Select(MapToMovieCard))
                .OrderByDescending(c => c.AverageRating)
                .ToList()
        };

        await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromHours(1), cancellationToken);
        return result;
    }

    public async Task<PagedResult<ContentCardDto>> GetShowsPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default)
    {
        var pagedShows = await _contentRepository.GetShowsPagedAsync(pageNumber, pageSize, genre, cancellationToken);
        var mapped = pagedShows.Items.Select(MapToShowCard).ToList();
        return new PagedResult<ContentCardDto>(mapped, pagedShows.TotalCount, pagedShows.PageNumber, pagedShows.PageSize);
    }

    public async Task<PagedResult<ContentCardDto>> GetMoviesPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default)
    {
        var pagedMovies = await _contentRepository.GetMoviesPagedAsync(pageNumber, pageSize, genre, cancellationToken);
        var mapped = pagedMovies.Items.Select(MapToMovieCard).ToList();
        return new PagedResult<ContentCardDto>(mapped, pagedMovies.TotalCount, pagedMovies.PageNumber, pagedMovies.PageSize);
    }

    public async Task<ShowDetailsDto> GetShowBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var show = await _contentRepository.GetShowBySlugAsync(slug, cancellationToken);
        if (show == null)
        {
            throw new NotFoundException("Show", slug);
        }

        var seasons = await _contentRepository.GetSeasonsByShowIdAsync(show.Id, cancellationToken);
        var seasonDtos = new List<SeasonDto>();

        if (seasons.Count == 0 && show.TotalSeasons > 0)
        {
            var createdSeasons = new List<Season>();
            for (int s = 1; s <= Math.Min(show.TotalSeasons, 4); s++)
            {
                var newSeason = new Season
                {
                    ShowId = show.Id,
                    SeasonNumber = s,
                    Title = $"Season {s}",
                    Overview = $"Season {s} of {show.Title} follows pivotal power struggles and dramatic conflicts.",
                    EpisodeCount = 10,
                    AirDate = show.ReleaseDate
                };
                await _contentRepository.CreateSeasonAsync(newSeason, cancellationToken);
                createdSeasons.Add(newSeason);

                var episodeDtos = new List<EpisodeDto>();
                for (int epNum = 1; epNum <= 4; epNum++)
                {
                    var newEp = new Episode
                    {
                        ShowId = show.Id,
                        SeasonId = newSeason.Id,
                        SeasonNumber = s,
                        EpisodeNumber = epNum,
                        Title = epNum == 1 ? "Premiere: The Royal Gambit" : epNum == 2 ? "Alliances & Betrayals" : epNum == 3 ? "The Turning Point" : "Season Climax",
                        Overview = $"In Season {s}, Episode {epNum}, intense revelations and shifting loyalties push the Roy empire to its limits.",
                        StillPath = show.BackdropPath ?? show.PosterPath,
                        RuntimeMinutes = 58 + epNum,
                        AirDate = show.ReleaseDate,
                        RatingSummary = new RatingSummary { AverageRating = show.RatingSummary.AverageRating, TotalRatings = 4200 }
                    };
                    await _contentRepository.CreateEpisodeAsync(newEp, cancellationToken);
                    episodeDtos.Add(new EpisodeDto
                    {
                        Id = newEp.Id,
                        ShowId = show.Id,
                        SeasonId = newSeason.Id,
                        SeasonNumber = s,
                        EpisodeNumber = epNum,
                        Title = newEp.Title,
                        Overview = newEp.Overview,
                        StillPath = newEp.StillPath,
                        RuntimeMinutes = newEp.RuntimeMinutes,
                        AirDate = newEp.AirDate,
                        AverageRating = newEp.RatingSummary.AverageRating
                    });
                }

                seasonDtos.Add(new SeasonDto
                {
                    Id = newSeason.Id,
                    ShowId = show.Id,
                    SeasonNumber = s,
                    Title = newSeason.Title,
                    Overview = newSeason.Overview,
                    PosterPath = show.PosterPath,
                    EpisodeCount = 10,
                    AirDate = newSeason.AirDate,
                    Episodes = episodeDtos
                });
            }
        }
        else
        {
            foreach (var season in seasons)
            {
                var episodes = await _contentRepository.GetEpisodesBySeasonAsync(show.Id, season.SeasonNumber, cancellationToken);
                seasonDtos.Add(new SeasonDto
                {
                    Id = season.Id,
                    ShowId = season.ShowId,
                    SeasonNumber = season.SeasonNumber,
                    Title = season.Title,
                    Overview = season.Overview,
                    PosterPath = season.PosterPath,
                    EpisodeCount = season.EpisodeCount,
                    AirDate = season.AirDate,
                    Episodes = episodes.Select(e => new EpisodeDto
                    {
                        Id = e.Id,
                        ShowId = e.ShowId,
                        SeasonId = e.SeasonId,
                        SeasonNumber = e.SeasonNumber,
                        EpisodeNumber = e.EpisodeNumber,
                        Title = e.Title,
                        Overview = e.Overview,
                        StillPath = e.StillPath,
                        RuntimeMinutes = e.RuntimeMinutes,
                        AirDate = e.AirDate,
                        AverageRating = e.RatingSummary.AverageRating
                    }).ToList()
                });
            }
        }

        return new ShowDetailsDto
        {
            Id = show.Id,
            Title = show.Title,
            Slug = show.Slug,
            MediaType = "Show",
            Overview = show.Overview,
            PosterPath = show.PosterPath,
            BackdropPath = show.BackdropPath,
            Genres = show.Genres,
            ReleaseDate = show.ReleaseDate,
            AverageRating = show.RatingSummary.AverageRating,
            TotalRatings = show.RatingSummary.TotalRatings,
            Status = show.Status,
            TotalSeasons = show.TotalSeasons,
            TotalEpisodes = show.TotalEpisodes,
            StreamingPlatforms = show.StreamingPlatforms.Select(p => p.Platform).Distinct().ToList(),
            Platforms = show.StreamingPlatforms,
            Seasons = seasonDtos
        };
    }

    public async Task<MovieDetailsDto> GetMovieBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var movie = await _contentRepository.GetMovieBySlugAsync(slug, cancellationToken);
        if (movie == null)
        {
            throw new NotFoundException("Movie", slug);
        }

        return new MovieDetailsDto
        {
            Id = movie.Id,
            Title = movie.Title,
            Slug = movie.Slug,
            MediaType = "Movie",
            Overview = movie.Overview,
            PosterPath = movie.PosterPath,
            BackdropPath = movie.BackdropPath,
            Genres = movie.Genres,
            ReleaseDate = movie.ReleaseDate,
            AverageRating = movie.RatingSummary.AverageRating,
            TotalRatings = movie.RatingSummary.TotalRatings,
            RuntimeMinutes = movie.RuntimeMinutes,
            StreamingPlatforms = movie.StreamingPlatforms.Select(p => p.Platform).Distinct().ToList(),
            Platforms = movie.StreamingPlatforms
        };
    }

    public async Task<IReadOnlyList<EpisodeDto>> GetEpisodesBySeasonAsync(string showId, int seasonNumber, CancellationToken cancellationToken = default)
    {
        var episodes = await _contentRepository.GetEpisodesBySeasonAsync(showId, seasonNumber, cancellationToken);
        return episodes.Select(e => new EpisodeDto
        {
            Id = e.Id,
            ShowId = e.ShowId,
            SeasonId = e.SeasonId,
            SeasonNumber = e.SeasonNumber,
            EpisodeNumber = e.EpisodeNumber,
            Title = e.Title,
            Overview = e.Overview,
            StillPath = e.StillPath,
            RuntimeMinutes = e.RuntimeMinutes,
            AirDate = e.AirDate,
            AverageRating = e.RatingSummary.AverageRating
        }).ToList();
    }

    public async Task<List<ContentCardDto>> SearchAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<ContentCardDto>();
        }

        var results = await _contentRepository.SearchContentAsync(query, 12, cancellationToken);
        var mapped = new List<ContentCardDto>();

        foreach (var item in results)
        {
            if (item is Show s) mapped.Add(MapToShowCard(s));
            else if (item is Movie m) mapped.Add(MapToMovieCard(m));
        }

        return mapped;
    }

    public async Task<int> SeedCatalogIfEmptyAsync(CancellationToken cancellationToken = default)
    {
        var count = await _contentRepository.CountShowsAsync(cancellationToken);
        if (count > 0)
        {
            _logger.LogInformation("Database already contains {Count} shows. Skipping seed.", count);
            return (int)count;
        }

        _logger.LogInformation("Seeding rich initial entertainment catalog into MongoDB...");

        // 1. Severance (Show)
        var severance = new Show
        {
            Title = "Severance",
            Slug = "severance",
            Overview = "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
            PosterPath = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            BackdropPath = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
            Genres = new List<string> { "Sci-Fi", "Mystery", "Thriller" },
            ReleaseDate = "2022-02-18",
            Status = "Returning Series",
            TotalSeasons = 2,
            TotalEpisodes = 19,
            RatingSummary = new RatingSummary { AverageRating = 8.7, TotalRatings = 18450 },
            StreamingPlatforms = new List<StreamingPlatformLink>
            {
                new() { Platform = "Apple TV+", DeepLink = "https://tv.apple.com/show/severance", Regions = new() { "US", "UK", "IN", "CA" } }
            }
        };
        await _contentRepository.CreateShowAsync(severance, cancellationToken);

        var sevS1 = new Season
        {
            ShowId = severance.Id,
            SeasonNumber = 1,
            Title = "Season 1",
            Overview = "Welcome to Lumon Industries.",
            EpisodeCount = 9,
            AirDate = "2022-02-18"
        };
        await _contentRepository.CreateSeasonAsync(sevS1, cancellationToken);

        var sevEp1 = new Episode
        {
            ShowId = severance.Id,
            SeasonId = sevS1.Id,
            SeasonNumber = 1,
            EpisodeNumber = 1,
            Title = "Good News About Hell",
            Overview = "Mark Scout leads a team at Lumon Industries, whose employees have undergone a severance procedure.",
            RuntimeMinutes = 57,
            AirDate = "2022-02-18",
            RatingSummary = new RatingSummary { AverageRating = 8.4, TotalRatings = 3400 }
        };
        var sevEp9 = new Episode
        {
            ShowId = severance.Id,
            SeasonId = sevS1.Id,
            SeasonNumber = 1,
            EpisodeNumber = 9,
            Title = "The We We Are",
            Overview = "The severed Macrodata Refinement team executes their risky overtime contingency plan.",
            RuntimeMinutes = 43,
            AirDate = "2022-04-08",
            RatingSummary = new RatingSummary { AverageRating = 9.7, TotalRatings = 8900 }
        };
        await _contentRepository.CreateEpisodeAsync(sevEp1, cancellationToken);
        await _contentRepository.CreateEpisodeAsync(sevEp9, cancellationToken);

        // 2. House of the Dragon (Show)
        var hotd = new Show
        {
            Title = "House of the Dragon",
            Slug = "house-of-the-dragon",
            Overview = "The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from heights such as a this. In the case of the Targaryens, their slow fall begins when King Viserys breaks with a century of tradition.",
            PosterPath = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80",
            BackdropPath = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
            Genres = new List<string> { "Drama", "Fantasy", "Action" },
            ReleaseDate = "2022-08-21",
            Status = "Returning Series",
            TotalSeasons = 2,
            TotalEpisodes = 18,
            RatingSummary = new RatingSummary { AverageRating = 8.8, TotalRatings = 52900 },
            StreamingPlatforms = new List<StreamingPlatformLink>
            {
                new() { Platform = "Max", DeepLink = "https://max.com/shows/house-of-the-dragon", Regions = new() { "US", "CA" } },
                new() { Platform = "JioCinema", DeepLink = "https://jiocinema.com/hotd", Regions = new() { "IN" } }
            }
        };
        await _contentRepository.CreateShowAsync(hotd, cancellationToken);

        // 3. Succession (Show)
        var succession = new Show
        {
            Title = "Succession",
            Slug = "succession",
            Overview = "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their aging father steps down from the company.",
            PosterPath = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
            BackdropPath = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
            Genres = new List<string> { "Drama" },
            ReleaseDate = "2018-06-03",
            Status = "Ended",
            TotalSeasons = 4,
            TotalEpisodes = 39,
            RatingSummary = new RatingSummary { AverageRating = 8.9, TotalRatings = 67200 },
            StreamingPlatforms = new List<StreamingPlatformLink>
            {
                new() { Platform = "Max", DeepLink = "https://max.com/shows/succession", Regions = new() { "US" } }
            }
        };
        await _contentRepository.CreateShowAsync(succession, cancellationToken);

        // 4. Dune: Part Two (Movie)
        var dune2 = new Movie
        {
            Title = "Dune: Part Two",
            Slug = "dune-part-two",
            Overview = "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
            PosterPath = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
            BackdropPath = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1600&q=80",
            Genres = new List<string> { "Sci-Fi", "Adventure", "Action" },
            ReleaseDate = "2024-03-01",
            RuntimeMinutes = 166,
            RatingSummary = new RatingSummary { AverageRating = 8.9, TotalRatings = 89400 },
            StreamingPlatforms = new List<StreamingPlatformLink>
            {
                new() { Platform = "Max", DeepLink = "https://max.com/movies/dune-part-two", Regions = new() { "US", "CA" } }
            }
        };
        await _contentRepository.CreateMovieAsync(dune2, cancellationToken);

        // 5. Interstellar (Movie)
        var interstellar = new Movie
        {
            Title = "Interstellar",
            Slug = "interstellar",
            Overview = "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
            PosterPath = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
            BackdropPath = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
            Genres = new List<string> { "Sci-Fi", "Adventure", "Drama" },
            ReleaseDate = "2014-11-07",
            RuntimeMinutes = 169,
            RatingSummary = new RatingSummary { AverageRating = 8.7, TotalRatings = 154200 },
            StreamingPlatforms = new List<StreamingPlatformLink>
            {
                new() { Platform = "Prime Video", DeepLink = "https://primevideo.com/interstellar", Regions = new() { "US", "IN" } }
            }
        };
        await _contentRepository.CreateMovieAsync(interstellar, cancellationToken);

        // Invalidate trending cache so fresh seed appears immediately
        await _cacheService.RemoveAsync("discovery:trending", cancellationToken);

        return 5;
    }

    private static ContentCardDto MapToShowCard(Show s) => new()
    {
        Id = s.Id,
        Title = s.Title,
        Slug = s.Slug,
        MediaType = "Show",
        Overview = s.Overview,
        PosterPath = s.PosterPath,
        BackdropPath = s.BackdropPath,
        Genres = s.Genres,
        ReleaseDate = s.ReleaseDate,
        AverageRating = s.RatingSummary.AverageRating,
        TotalRatings = s.RatingSummary.TotalRatings,
        StreamingPlatforms = s.StreamingPlatforms.Select(p => p.Platform).Distinct().ToList()
    };

    private static ContentCardDto MapToMovieCard(Movie m) => new()
    {
        Id = m.Id,
        Title = m.Title,
        Slug = m.Slug,
        MediaType = "Movie",
        Overview = m.Overview,
        PosterPath = m.PosterPath,
        BackdropPath = m.BackdropPath,
        Genres = m.Genres,
        ReleaseDate = m.ReleaseDate,
        AverageRating = m.RatingSummary.AverageRating,
        TotalRatings = m.RatingSummary.TotalRatings,
        StreamingPlatforms = m.StreamingPlatforms.Select(p => p.Platform).Distinct().ToList()
    };
}
