using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service.IService
{
    public interface ITokenIntrospectionService
    {
        Task<IntrospectResponseDto> IntrospectAsync(IntrospectRequestDto request);
        Task<IntrospectResponseDto> IntrospectTokenAsync(HttpRequest request);
    }
}