using System.Net;
using System.Text.Json;
using OTTPro.Application.Common.Exceptions;
using OTTPro.Application.Common.Models;

namespace OTTPro.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            ValidationException validationEx => HandleValidationException(context, validationEx),
            NotFoundException notFoundEx => HandleNotFoundException(context, notFoundEx),
            UnauthorizedException unauthorizedEx => HandleUnauthorizedException(context, unauthorizedEx),
            ForbiddenException forbiddenEx => HandleForbiddenException(context, forbiddenEx),
            ConflictException conflictEx => HandleConflictException(context, conflictEx),
            BadRequestException badRequestEx => HandleBadRequestException(context, badRequestEx),
            _ => HandleUnknownException(context, exception)
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }

    private static ApiResponse<object> HandleValidationException(HttpContext context, ValidationException ex)
    {
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        var errorList = ex.Errors.SelectMany(kv => kv.Value).ToList();
        return ApiResponse<object>.FailureResponse(ex.Message, errorList);
    }

    private static ApiResponse<object> HandleNotFoundException(HttpContext context, NotFoundException ex)
    {
        context.Response.StatusCode = (int)HttpStatusCode.NotFound;
        return ApiResponse<object>.FailureResponse(ex.Message);
    }

    private static ApiResponse<object> HandleUnauthorizedException(HttpContext context, UnauthorizedException ex)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
        return ApiResponse<object>.FailureResponse(ex.Message);
    }

    private static ApiResponse<object> HandleForbiddenException(HttpContext context, ForbiddenException ex)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
        return ApiResponse<object>.FailureResponse(ex.Message);
    }

    private static ApiResponse<object> HandleConflictException(HttpContext context, ConflictException ex)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Conflict;
        return ApiResponse<object>.FailureResponse(ex.Message);
    }

    private static ApiResponse<object> HandleBadRequestException(HttpContext context, BadRequestException ex)
    {
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        return ApiResponse<object>.FailureResponse(ex.Message);
    }

    private static ApiResponse<object> HandleUnknownException(HttpContext context, Exception ex)
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        return ApiResponse<object>.FailureResponse("An unexpected server error occurred. Please try again later.");
    }
}
