using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        //[HttpPost, Authorize]
        //public async Task<ActionResult<List><Car>> AddCar([FromQuery] string userId)
        //{
        //    // In a real application, you would add logic to make the user an admin.
        //    // For example, you might update a database record to set an "IsAdmin" flag.
        //    // Here, we'll just return a success message for demonstration purposes.
        //    return Ok(new { message = $"User with ID {userId} has been made an admin." });
        //}

    }
}
