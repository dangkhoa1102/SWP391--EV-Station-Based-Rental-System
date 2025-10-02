using EVStation_basedRentalSystem.Services.AuthAPI.Models;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service.IService
{
    public interface ITokenService
    {
        Task<Token?> GetByUserIdAsync(string userId);
        Task SaveAsync(Token token);
        Task DeleteAsync(string userId);

        // Extended
        Task<Token?> GetByRefreshTokenAsync(string refreshToken);
        Task<bool> IsRefreshTokenValidAsync(string refreshToken);
    }
}
