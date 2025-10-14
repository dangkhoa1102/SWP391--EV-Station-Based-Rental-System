using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;
using System.Security.Claims;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ResponseDto<UserDto>>> Register([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<UserDto>.Failure("Dữ liệu không hợp lệ"));
            }

            var result = await _authService.RegisterAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<ActionResult<ResponseDto<LoginResponseDto>>> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<LoginResponseDto>.Failure("Dữ liệu không hợp lệ"));
            }

            var result = await _authService.LoginAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<string>>> Logout()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<string>.Failure("Unauthorized"));
            }

            var result = await _authService.LogoutAsync(userId);
            return Ok(result);
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<ResponseDto<string>>> RefreshToken([FromBody] string refreshToken)
        {
            var result = await _authService.RefreshTokenAsync(refreshToken);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<UserDto>>> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<UserDto>.Failure("Unauthorized"));
            }

            var result = await _authService.GetCurrentUserAsync(userId);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<UserDto>>> UpdateProfile([FromBody] UpdateUserDto request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<UserDto>.Failure("Unauthorized"));
            }

            var result = await _authService.UpdateUserAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult<ResponseDto<string>>> ChangePassword([FromBody] ChangePasswordDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ResponseDto<string>.Failure("Dữ liệu không hợp lệ"));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ResponseDto<string>.Failure("Unauthorized"));
            }

            var result = await _authService.ChangePasswordAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}