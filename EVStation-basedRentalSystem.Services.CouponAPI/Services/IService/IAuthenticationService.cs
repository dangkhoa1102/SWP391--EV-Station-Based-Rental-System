using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service.IService
{
    public interface IAuthenticationService
    {
        Task<LoginResponseDto> AuthenticateAsync(LoginRequestDto loginRequest, HttpResponse response);
        Task<RefreshTokenResponseDto> RefreshAsync(HttpRequest request);
        Task<string> LogoutAsync(HttpResponse response);
    }
}