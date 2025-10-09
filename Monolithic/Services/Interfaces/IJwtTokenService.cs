using System.Security.Claims;

namespace Monolithic.Services.Interfaces
{
    public interface IJwtTokenService
    {
        string GenerateAccessToken(string userId, string email, List<string> roles);
        string GenerateRefreshToken();
        ClaimsPrincipal ValidateToken(string token);
        Task<string> SaveRefreshTokenAsync(string userId, string refreshToken);
        Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken);
        Task RevokeRefreshTokenAsync(string userId);
    }
}