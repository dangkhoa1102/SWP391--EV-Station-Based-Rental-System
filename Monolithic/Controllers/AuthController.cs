using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Monolithic.Models;
using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUserService userService,
            IConfiguration configuration,
            IMapper mapper,
            ILogger<AuthController> logger)
        {
            _userService = userService;
            _configuration = configuration;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ResponseDto<UserDto>>> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userService.FindByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    return BadRequest(ResponseDto<UserDto>.Failure("Email đã được sử dụng"));
                }

                // Create new user
                var user = _mapper.Map<User>(request);
                
                var success = await _userService.CreateUserAsync(user, request.Password);

                if (!success)
                {
                    return BadRequest(ResponseDto<UserDto>.Failure("Đăng ký thất bại"));
                }

                var userDto = _mapper.Map<UserDto>(user);
                return Ok(ResponseDto<UserDto>.Success(userDto, "Đăng ký thành công"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during user registration");
                return StatusCode(500, ResponseDto<UserDto>.Failure("Đã xảy ra lỗi trong quá trình đăng ký"));
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<ResponseDto<LoginResponseDto>>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                var user = await _userService.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return BadRequest(ResponseDto<LoginResponseDto>.Failure("Email hoặc mật khẩu không đúng"));
                }

                if (!user.IsActive)
                {
                    return BadRequest(ResponseDto<LoginResponseDto>.Failure("Tài khoản đã bị vô hiệu hóa"));
                }

                var isPasswordValid = await _userService.CheckPasswordAsync(user, request.Password);
                if (!isPasswordValid)
                {
                    return BadRequest(ResponseDto<LoginResponseDto>.Failure("Email hoặc mật khẩu không đúng"));
                }

                // Update last login
                user.UpdatedAt = DateTime.UtcNow;
                await _userService.UpdateUserAsync(user);

                // Generate JWT token
                var token = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken();

                var userDto = _mapper.Map<UserDto>(user);
                var loginResponse = new LoginResponseDto
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    User = userDto
                };

                return Ok(ResponseDto<LoginResponseDto>.Success(loginResponse, "Đăng nhập thành công"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during user login");
                return StatusCode(500, ResponseDto<LoginResponseDto>.Failure("Đã xảy ra lỗi trong quá trình đăng nhập"));
            }
        }

        [HttpPost("change-password")]
        public async Task<ActionResult<ResponseDto<string>>> ChangePassword([FromBody] ChangePasswordDto request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(ResponseDto<string>.Failure("Vui lòng đăng nhập"));
                }

                var user = await _userService.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(ResponseDto<string>.Failure("Không tìm thấy người dùng"));
                }

                var success = await _userService.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
                if (!success)
                {
                    return BadRequest(ResponseDto<string>.Failure("Mật khẩu hiện tại không đúng"));
                }

                return Ok(ResponseDto<string>.Success(string.Empty, "Đổi mật khẩu thành công"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during password change");
                return StatusCode(500, ResponseDto<string>.Failure("Đã xảy ra lỗi trong quá trình đổi mật khẩu"));
            }
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.UserId.ToString()), // Use UserId instead of Id
                new(ClaimTypes.Name, user.UserName ?? ""),
                new(ClaimTypes.Email, user.Email ?? ""),
                new("UserId", user.UserId.ToString()),
                new("FirstName", user.FirstName),
                new("LastName", user.LastName),
                new("UserRole", user.UserRole),
                new(ClaimTypes.Role, user.UserRole)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey ?? throw new InvalidOperationException("JWT SecretKey is not configured")));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateRefreshToken()
        {
            return Guid.NewGuid().ToString();
        }
    }
}