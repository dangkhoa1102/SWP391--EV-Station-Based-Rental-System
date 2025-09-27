using APIs.Entities;
using APIs.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "STAFF")]
    public class StaffController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;

        public StaffController(UserManager<ApplicationUser> userManager, IEmailService emailService)
        {
            _userManager = userManager;
            _emailService = emailService;
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

        [HttpPost("send-renter-confirm/{userId}")]        
        public async Task<IActionResult> SendRenterConfirm(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) return NotFound();

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            //var confirmationLink = Url.Action(
            //    nameof(ConfirmRenter),
            //    "Auth",
            //    new { userId = user.Id, token },
            //    Request.Scheme);

            // encode token để đưa vào URL
            var encodedToken = System.Web.HttpUtility.UrlEncode(token);

            // Tạo link tuyệt đối: /api/Auth/confirm-renter?userId=...&token=...
            var confirmationLink = $"{Request.Scheme}://{Request.Host}/api/auth/confirm-renter?userId={WebUtility.UrlEncode(user.Id)}&token={encodedToken}";

            var html = $"Chào {user.FullName ?? user.Email},<br/>" +
                       $"Bấm vào link sau để xác nhận email và được cấp role RENTER:<br/>" +
                       $"<a href=\"{confirmationLink}\">Xác nhận đăng ký (RENTER)</a>";

            // Gửi email
            await _emailService.SendEmailAsync(user.Email, "Confirm your RENTER role", html);

            return Ok("Confirmation email sent");
        }

    }
}
