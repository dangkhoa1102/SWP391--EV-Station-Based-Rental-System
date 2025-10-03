using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service.IService
{
    public interface IRegistrationService
    {
        Task<RegistrationResponseDto> RegisterUserAsync(RegistrationRequestDto registerRequest);
        Task<string> ForgotPasswordAsync(string email);
        Task<string> ResetPasswordAsync(string resetKey);
        Task<string> ChangePasswordAsync(ChangePasswordRequestDto changePasswordRequest);
    }
}