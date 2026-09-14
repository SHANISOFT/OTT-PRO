namespace OTTPro.Application.Common.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 500) : base(message)
    {
        StatusCode = statusCode;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message, 404)
    {
    }

    public NotFoundException(string resourceName, object key)
        : base($"Resource '{resourceName}' with key ({key}) was not found.", 404)
    {
    }
}

public class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation failures have occurred.", 400)
    {
        Errors = errors;
    }

    public ValidationException(string field, string message)
        : base(message, 400)
    {
        Errors = new Dictionary<string, string[]>
        {
            { field, new[] { message } }
        };
    }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Unauthorized access.")
        : base(message, 401)
    {
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to access this resource.")
        : base(message, 403)
    {
    }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message)
        : base(message, 400)
    {
    }
}

public class ConflictException : AppException
{
    public ConflictException(string message)
        : base(message, 409)
    {
    }
}
