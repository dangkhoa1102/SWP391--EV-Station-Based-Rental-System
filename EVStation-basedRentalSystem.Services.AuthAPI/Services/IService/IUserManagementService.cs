using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service.IService
{
    public interface IUserManagementService
    {
        Task<UserDto> GetAccountAsync(ClaimsPrincipal principal);
        Task<List<UserDto>> FindAllAsync();
        Task<UserDto> FindByIdAsync(string accountId);
        Task<UserDto> ActivateAccountAsync(string verificationCode);
        Task<string> DeleteAccountAsync(string accountId);
    }
}