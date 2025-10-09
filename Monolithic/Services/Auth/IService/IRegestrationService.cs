using Monolithic.Models.Auth.Dto.Request;
using Monolithic.Models.Auth.Dto.Response;
using System.Threading.Tasks;

namespace Monolithic.Services.Auth.IService
{
    public interface IRegistrationService
    {
        Task<RegistrationResponseDto> RegisterUserAsync(RegistrationRequestDto registerRequest);
        Task<string> ForgotPasswordAsync(string email);
        Task<string> ResetPasswordAsync(string resetKey);
        Task<string> ChangePasswordAsync(ChangePasswordRequestDto changePasswordRequest);
    }
}