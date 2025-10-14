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

        /// <summary>
        /// Đăng ký tài khoản mới
        /// </summary>
        [HttpPost("Register")]
        [ProducesResponseType(typeof(ResponseDto<UserDto>), 200)]
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

        /// <summary>
        /// Đăng nhập hệ thống
        /// </summary>
        [HttpPost("Login")]
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

        /// <summary>
        /// Đăng xuất khỏi hệ thống
        /// </summary>
        [HttpPost("Logout")]
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

        /// <summary>
        /// Làm mới Access Token
        /// </summary>
        [HttpPost("Refresh-Token")]
        public async Task<ActionResult<ResponseDto<string>>> RefreshToken([FromBody] string refreshToken)
        {
            var result = await _authService.RefreshTokenAsync(refreshToken);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
