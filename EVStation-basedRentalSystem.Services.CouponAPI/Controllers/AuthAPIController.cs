using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using EVStation_basedRentalSystem.Services.AuthAPI.Service.IService;
using EVStation_basedRentalSystem.Services.AuthAPI.Services.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthenticationService _authService;
        private readonly IRegistrationService _registrationService;
        private readonly IUserManagementService _userManagementService;
       
        private readonly IAuthorizeService _authorizeService;

        public AuthController(
            IAuthenticationService authService,
            IRegistrationService registrationService,
            IUserManagementService userManagementService,
            IAuthorizeService authorizeService)
        {
            _authService = authService;
            _registrationService = registrationService;
            _userManagementService = userManagementService;
            _authorizeService = authorizeService;
        }

        // ----------------------- AUTH -----------------------
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var result = await _authService.AuthenticateAsync(request, Response);
            return Ok(result);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh()
        {
            var result = await _authService.RefreshAsync(Request);
            return Ok(result);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var result = await _authService.LogoutAsync(Response);
            return Ok(result);
        }

        // ----------------------- REGISTRATION -----------------------
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegistrationRequestDto request)
        {
            var result = await _registrationService.RegisterUserAsync(request);
            return Ok(result);
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var result = await _registrationService.ForgotPasswordAsync(request.Email);
            return Ok(result);
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            var result = await _registrationService.ResetPasswordAsync(request.NewPassword.ToLower());

            return Ok(result);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            var result = await _registrationService.ChangePasswordAsync(request);
            return Ok(result);
        }

        // ----------------------- USER MANAGEMENT -----------------------
        [Authorize]
        [HttpGet("me")]
        public IActionResult GetMe()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            return Ok(new { UserId = userId, Email = email });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _userManagementService.FindByIdAsync(id);
            return Ok(user);
        }

        [HttpGet]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManagementService.FindAllAsync();
            return Ok(users);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var result = await _userManagementService.DeleteAccountAsync(id);
            return Ok(result);
        }

        // ----------------------- AUTHORIZATION -----------------------
        [HttpPost("assign-role")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest request)
        {
            var result = await _authorizeService.AssignRoleAsync(request);
            return Ok(result);
        }

        [HttpPost("revoke-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RevokeRole([FromBody] AssignRoleRequest request)
        {
            var result = await _authorizeService.RevokeRoleAsync(request);
            return Ok(result);
        }
    }
}
