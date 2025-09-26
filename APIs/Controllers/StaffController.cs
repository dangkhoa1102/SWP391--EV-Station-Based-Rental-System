using APIs.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "STAFF")]
    public class StaffController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public StaffController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest request)
        {
            // Chỉ cho phép duy nhất role này
            var allowedRoles = new[] { "RENTER" };
            if (!allowedRoles.Contains(request.Role.ToUpper()))
                return BadRequest("Invalid role. Only RENTER can be assigned.");

            // Tìm user
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null) return NotFound("User not found");

            // Lấy roles hiện tại của user
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any())
                return BadRequest("User already has a role assigned");

            // Thêm role mới
            var result = await _userManager.AddToRoleAsync(user, request.Role.ToUpper());
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok($"Role {request.Role} assigned to {request.Email}");
        }

        [HttpDelete("remove-role")]
        public async Task<IActionResult> RemoveRole([FromQuery] string userEmail, [FromQuery] string roles)
        {
            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user is null)
                return NotFound(new { message = "User not found" });

            var result = await _userManager.RemoveFromRoleAsync(user, roles);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = $"Removed role '{roles}' from {user.Email}" });
        }
    }
}
