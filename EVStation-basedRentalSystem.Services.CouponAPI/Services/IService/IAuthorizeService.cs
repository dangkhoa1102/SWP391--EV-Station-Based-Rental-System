using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Services.IService
{
    public interface IAuthorizeService
    {
        Task<string> AssignRoleAsync(AssignRoleRequest assignRoleRequest);
        Task<string> RevokeRoleAsync(AssignRoleRequest assignRoleRequest);
    }

}
