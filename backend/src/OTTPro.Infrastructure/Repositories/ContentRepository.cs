using MongoDB.Driver;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Domain.Entities;
using OTTPro.Infrastructure.Data;

namespace OTTPro.Infrastructure.Repositories;

public class ContentRepository : IContentRepository
{
    private readonly MongoDbContext _context;

    public ContentRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<Show?> GetShowByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Show>.Filter.And(
            Builders<Show>.Filter.Eq(s => s.Id, id),
            Builders<Show>.Filter.Eq(s => s.IsDeleted, false)
        );
        return await _context.Shows.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Show?> GetShowBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Show>.Filter.And(
            Builders<Show>.Filter.Eq(s => s.Slug, slug.ToLowerInvariant()),
            Builders<Show>.Filter.Eq(s => s.IsDeleted, false)
        );
        return await _context.Shows.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Movie?> GetMovieByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Movie>.Filter.And(
            Builders<Movie>.Filter.Eq(m => m.Id, id),
            Builders<Movie>.Filter.Eq(m => m.IsDeleted, false)
        );
        return await _context.Movies.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Movie?> GetMovieBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Movie>.Filter.And(
            Builders<Movie>.Filter.Eq(m => m.Slug, slug.ToLowerInvariant()),
            Builders<Movie>.Filter.Eq(m => m.IsDeleted, false)
        );
        return await _context.Movies.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<Show>> GetShowsPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 12;

        var filterBuilder = Builders<Show>.Filter;
        var filter = filterBuilder.Eq(s => s.IsDeleted, false);

        if (!string.IsNullOrEmpty(genre))
        {
            filter = filterBuilder.And(filter, filterBuilder.AnyEq(s => s.Genres, genre));
        }

        var totalCount = await _context.Shows.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
        var items = await _context.Shows.Find(filter)
            .SortByDescending(s => s.RatingSummary.AverageRating)
            .Skip((pageNumber - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Show>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<PagedResult<Movie>> GetMoviesPagedAsync(int pageNumber, int pageSize, string? genre = null, CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 12;

        var filterBuilder = Builders<Movie>.Filter;
        var filter = filterBuilder.Eq(m => m.IsDeleted, false);

        if (!string.IsNullOrEmpty(genre))
        {
            filter = filterBuilder.And(filter, filterBuilder.AnyEq(m => m.Genres, genre));
        }

        var totalCount = await _context.Movies.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
        var items = await _context.Movies.Find(filter)
            .SortByDescending(m => m.RatingSummary.AverageRating)
            .Skip((pageNumber - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Movie>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<IReadOnlyList<Season>> GetSeasonsByShowIdAsync(string showId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Season>.Filter.And(
            Builders<Season>.Filter.Eq(s => s.ShowId, showId),
            Builders<Season>.Filter.Eq(s => s.IsDeleted, false)
        );
        return await _context.Seasons.Find(filter).SortBy(s => s.SeasonNumber).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Episode>> GetEpisodesBySeasonAsync(string showId, int seasonNumber, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Episode>.Filter.And(
            Builders<Episode>.Filter.Eq(e => e.ShowId, showId),
            Builders<Episode>.Filter.Eq(e => e.SeasonNumber, seasonNumber),
            Builders<Episode>.Filter.Eq(e => e.IsDeleted, false)
        );
        return await _context.Episodes.Find(filter).SortBy(e => e.EpisodeNumber).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Show>> GetTrendingShowsAsync(int limit = 10, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Show>.Filter.Eq(s => s.IsDeleted, false);
        return await _context.Shows.Find(filter)
            .SortByDescending(s => s.RatingSummary.AverageRating)
            .Limit(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Movie>> GetTrendingMoviesAsync(int limit = 10, CancellationToken cancellationToken = default)
    {
        var filter = Builders<Movie>.Filter.Eq(m => m.IsDeleted, false);
        return await _context.Movies.Find(filter)
            .SortByDescending(m => m.RatingSummary.AverageRating)
            .Limit(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<object>> SearchContentAsync(string query, int limit = 10, CancellationToken cancellationToken = default)
    {
        var cleanQuery = query.Trim().ToLowerInvariant();
        var showFilter = Builders<Show>.Filter.And(
            Builders<Show>.Filter.Regex(s => s.Title, new MongoDB.Bson.BsonRegularExpression(cleanQuery, "i")),
            Builders<Show>.Filter.Eq(s => s.IsDeleted, false)
        );
        var movieFilter = Builders<Movie>.Filter.And(
            Builders<Movie>.Filter.Regex(m => m.Title, new MongoDB.Bson.BsonRegularExpression(cleanQuery, "i")),
            Builders<Movie>.Filter.Eq(m => m.IsDeleted, false)
        );

        var shows = await _context.Shows.Find(showFilter).Limit(limit).ToListAsync(cancellationToken);
        var movies = await _context.Movies.Find(movieFilter).Limit(limit).ToListAsync(cancellationToken);

        var results = new List<object>();
        results.AddRange(shows);
        results.AddRange(movies);
        return results;
    }

    public async Task<long> CountShowsAsync(CancellationToken cancellationToken = default)
    {
        var filter = Builders<Show>.Filter.Eq(s => s.IsDeleted, false);
        return await _context.Shows.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
    }

    public async Task CreateShowAsync(Show show, CancellationToken cancellationToken = default)
    {
        await _context.Shows.InsertOneAsync(show, null, cancellationToken);
    }

    public async Task CreateMovieAsync(Movie movie, CancellationToken cancellationToken = default)
    {
        await _context.Movies.InsertOneAsync(movie, null, cancellationToken);
    }

    public async Task CreateSeasonAsync(Season season, CancellationToken cancellationToken = default)
    {
        await _context.Seasons.InsertOneAsync(season, null, cancellationToken);
    }

    public async Task CreateEpisodeAsync(Episode episode, CancellationToken cancellationToken = default)
    {
        await _context.Episodes.InsertOneAsync(episode, null, cancellationToken);
    }
}
