using Microsoft.AspNetCore.Mvc;
using OTTPro.Application.Common.Models;

namespace OTTPro.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult<ApiResponse<T>> OkResponse<T>(T data, string message = "Success")
    {
        return Ok(ApiResponse<T>.SuccessResponse(data, message));
    }

    protected ActionResult<ApiResponse<T>> CreatedResponse<T>(string actionName, object routeValues, T data, string message = "Created successfully")
    {
        return CreatedAtAction(actionName, routeValues, ApiResponse<T>.SuccessResponse(data, message));
    }
}
