using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ResponseDto<LoginResponseDto>> LoginAsync(LoginRequestDto request);
        Task<ResponseDto<UserDto>> RegisterAsync(RegisterRequestDto request);
        Task<ResponseDto<string>> VerifyEmailAsync(VerifyEmailDto request);
        Task<ResponseDto<string>> ResendOtpAsync(string email);
        Task<ResponseDto<string>> ForgotPasswordAsync(ForgotPasswordDto request);
        Task<ResponseDto<string>> ResetPasswordAsync(ResetPasswordDto request);
        Task<ResponseDto<string>> LogoutAsync(string userId);
        Task<ResponseDto<string>> RefreshTokenAsync(string refreshToken);
        Task<ResponseDto<UserDto>> GetCurrentUserAsync(string userId);
        Task<ResponseDto<UserDto>> UpdateUserAsync(string userId, UpdateUserDto request);
        Task<ResponseDto<string>> ChangePasswordAsync(string userId, ChangePasswordDto request);
    }
}
