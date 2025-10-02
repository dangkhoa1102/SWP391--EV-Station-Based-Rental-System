using System.Security.Claims;
using EVStation_basedRentalSystem.Services.AuthAPI.Data;
using EVStation_basedRentalSystem.Services.AuthAPI.Models;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using EVStation_basedRentalSystem.Services.AuthAPI.Service.IService;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;

        public AuthenticationService(AppDbContext db,
                                     UserManager<ApplicationUser> userManager,
                                     IJwtTokenGenerator jwtTokenGenerator)
        {
            _db = db;
            _userManager = userManager;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

        public async Task<LoginResponseDto> AuthenticateAsync(LoginRequestDto loginRequest, HttpResponse response)
        {
            var user = await _userManager.FindByNameAsync(loginRequest.Username.ToLower());
            if (user == null || !await _userManager.CheckPasswordAsync(user, loginRequest.Password))
            {
                return new LoginResponseDto { User = null, Token = "" };
            }

            var roles = await _userManager.GetRolesAsync(user);

            var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles);
            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            // Persist refresh token in DB
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            var userDto = new UserDto
            {
                Email = user.Email,
                ID = user.Id,
                Name = user.Name,
                PhoneNumber = user.PhoneNumber
            };

            return new LoginResponseDto
            {
                User = userDto,
                Token = accessToken,
                RefreshToken = refreshToken,
                TokenExpiry = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<RefreshTokenResponseDto> RefreshAsync(HttpRequest request)
        {
            var refreshToken = request.Headers["Refresh-Token"].ToString();
            if (string.IsNullOrEmpty(refreshToken))
                return new RefreshTokenResponseDto { Token = "", RefreshToken = "", TokenExpiry = DateTime.MinValue };

            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
            if (user == null || user.RefreshTokenExpiry == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                return new RefreshTokenResponseDto { Token = "", RefreshToken = "", TokenExpiry = DateTime.MinValue };
            }

            var roles = await _userManager.GetRolesAsync(user);
            var newAccessToken = _jwtTokenGenerator.GenerateAccessToken(user, roles);
            var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                throw new Exception("Failed to update refresh token: " + string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            return new RefreshTokenResponseDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken,
                TokenExpiry = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<string> LogoutAsync(HttpResponse response)
        {
            var userId = response.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return "User not logged in";

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return "Logout failed: " + string.Join(", ", result.Errors.Select(e => e.Description));
                }
            }

            response.Headers.Remove("Authorization");
            return "Logged out successfully";
        }
        }
    }
