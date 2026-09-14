using System.Linq.Expressions;
using MongoDB.Bson;
using MongoDB.Driver;
using OTTPro.Application.Common.Models;
using OTTPro.Application.Interfaces.Repositories;
using OTTPro.Domain.Common;
using OTTPro.Infrastructure.Data;

namespace OTTPro.Infrastructure.Repositories;

public class BaseRepository<T> : IBaseRepository<T> where T : BaseEntity
{
    protected readonly IMongoCollection<T> _collection;

    public BaseRepository(MongoDbContext context, string collectionName)
    {
        _collection = context.GetCollection<T>(collectionName);
    }

    public virtual async Task<T?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Eq(x => x.Id, id),
            Builders<T>.Filter.Eq(x => x.IsDeleted, false)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.Eq(x => x.IsDeleted, false);
        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Where(predicate),
            Builders<T>.Filter.Eq(x => x.IsDeleted, false)
        );
        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public virtual async Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Where(predicate),
            Builders<T>.Filter.Eq(x => x.IsDeleted, false)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public virtual async Task<PagedResult<T>> GetPagedAsync(
        Expression<Func<T, bool>> predicate,
        int pageNumber,
        int pageSize,
        Expression<Func<T, object>>? orderBy = null,
        bool isDescending = false,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Where(predicate),
            Builders<T>.Filter.Eq(x => x.IsDeleted, false)
        );

        var totalCount = await _collection.CountDocumentsAsync(filter, cancellationToken: cancellationToken);

        var query = _collection.Find(filter);

        if (orderBy != null)
        {
            query = isDescending ? query.SortByDescending(orderBy) : query.SortBy(orderBy);
        }
        else
        {
            query = query.SortByDescending(x => x.CreatedAt);
        }

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(items, totalCount, pageNumber, pageSize);
    }

    public virtual async Task<CursorPagedResult<T>> GetCursorPagedAsync(
        Expression<Func<T, bool>> predicate,
        string? cursorId,
        int limit,
        bool isDescending = true,
        CancellationToken cancellationToken = default)
    {
        if (limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        var filterBuilder = Builders<T>.Filter;
        var filter = filterBuilder.And(
            filterBuilder.Where(predicate),
            filterBuilder.Eq(x => x.IsDeleted, false)
        );

        if (!string.IsNullOrEmpty(cursorId))
        {
            var cursorFilter = isDescending
                ? filterBuilder.Lt(x => x.Id, cursorId)
                : filterBuilder.Gt(x => x.Id, cursorId);

            filter = filterBuilder.And(filter, cursorFilter);
        }

        var query = _collection.Find(filter);
        query = isDescending ? query.SortByDescending(x => x.Id) : query.SortBy(x => x.Id);

        // Fetch limit + 1 to detect if there's a next page
        var items = await query.Limit(limit + 1).ToListAsync(cancellationToken);

        var hasMore = items.Count > limit;
        if (hasMore)
        {
            items.RemoveAt(limit);
        }

        var nextCursor = items.Count > 0 ? items[^1].Id : null;

        return new CursorPagedResult<T>(items, nextCursor, hasMore);
    }

    public virtual async Task<long> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Where(predicate),
            Builders<T>.Filter.Eq(x => x.IsDeleted, false)
        );
        return await _collection.CountDocumentsAsync(filter, cancellationToken: cancellationToken);
    }

    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Where(predicate),
            Builders<T>.Filter.Eq(x => x.IsDeleted, false)
        );
        return await _collection.Find(filter).AnyAsync(cancellationToken);
    }

    public virtual async Task<T> CreateAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        await _collection.InsertOneAsync(entity, null, cancellationToken);
        return entity;
    }

    public virtual async Task CreateManyAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        var list = entities.ToList();
        var now = DateTime.UtcNow;
        foreach (var entity in list)
        {
            entity.CreatedAt = now;
            entity.UpdatedAt = now;
        }
        if (list.Count > 0)
        {
            await _collection.InsertManyAsync(list, null, cancellationToken);
        }
    }

    public virtual async Task<bool> UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        var filter = Builders<T>.Filter.Eq(x => x.Id, entity.Id);
        var result = await _collection.ReplaceOneAsync(filter, entity, cancellationToken: cancellationToken);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }

    public virtual async Task<bool> DeleteAsync(string id, bool softDelete = true, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.Eq(x => x.Id, id);

        if (softDelete)
        {
            var update = Builders<T>.Update
                .Set(x => x.IsDeleted, true)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);
            var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }
        else
        {
            var result = await _collection.DeleteOneAsync(filter, cancellationToken);
            return result.IsAcknowledged && result.DeletedCount > 0;
        }
    }
}
