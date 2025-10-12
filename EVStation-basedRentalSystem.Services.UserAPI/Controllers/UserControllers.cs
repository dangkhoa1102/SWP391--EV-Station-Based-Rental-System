using EVStation_basedRentalSystem.Services.UserAPI.Clients;
using EVStation_basedRentalSystem.Services.UserAPI.Data;
using EVStation_basedRentalSystem.Services.UserAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.UserAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AuthServiceClient _authService;
        private readonly UserDbContext _db;

        public UsersController(AuthServiceClient authService, UserDbContext db)
        {
            _authService = authService;
            _db = db;
        }

        // 🔹 Called from AuthAPI to sync user info
        [HttpPost("sync")]
        [AllowAnonymous] // AuthAPI will call this directly
        public async Task<IActionResult> SyncUser([FromBody] UserDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.ID))
                return BadRequest("Invalid user data");

            var existing = await _db.Users.FindAsync(dto.ID);
            if (existing == null)
            {
                var newUser = new User
                {
                    Id = dto.ID, // 👈 same as Auth user ID
                    Username = dto.Name ?? dto.Email,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    PasswordHash = "FromAuth", // placeholder, no password stored here
                };
                _db.Users.Add(newUser);
            }
            else
            {
                existing.Email = dto.Email;
                existing.Username = dto.Name ?? dto.Email;
                existing.PhoneNumber = dto.PhoneNumber;
                existing.UpdatedAt = DateTime.UtcNow;
                _db.Users.Update(existing);
            }

            await _db.SaveChangesAsync();
            return Ok(new { Message = "User synced successfully", UserId = dto.ID });
        }

        // 🔹 Example: Get current user profile
        [HttpGet("profile")]
        [Authorize]
        public IActionResult GetProfile()
        {
            var userId = User.Identity?.Name ?? "Unknown";
            var roles = User.Claims.Where(c => c.Type == "role").Select(c => c.Value).ToList();
            return Ok(new { UserId = userId, Roles = roles });
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetAdminData()
        {
            return Ok("This is admin-only data");
        }

        [HttpGet("validate")]
        public async Task<IActionResult> ValidateToken([FromHeader(Name = "Authorization")] string authorization)
        {
            if (string.IsNullOrEmpty(authorization) || !authorization.StartsWith("Bearer "))
                return BadRequest("Missing token");

            var token = authorization.Substring("Bearer ".Length);
            var isValid = await _authService.ValidateTokenAsync(token);

            return Ok(new { TokenValid = isValid });
        }
    }

    // 🔸 Add this DTO if missing
    public class UserDto
    {
        public string ID { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
    }
}
