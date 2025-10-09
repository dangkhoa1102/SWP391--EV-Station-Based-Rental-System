using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ResponseDto<LoginResponseDto>> LoginAsync(LoginRequestDto request);
        Task<ResponseDto<UserDto>> RegisterAsync(RegisterRequestDto request);
        Task<ResponseDto<string>> LogoutAsync(string userId);
        Task<ResponseDto<string>> RefreshTokenAsync(string refreshToken);
        Task<ResponseDto<UserDto>> GetCurrentUserAsync(string userId);
        Task<ResponseDto<UserDto>> UpdateUserAsync(string userId, UpdateUserDto request);
        Task<ResponseDto<string>> ChangePasswordAsync(string userId, ChangePasswordDto request);
    }

    public class UpdateUserDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}