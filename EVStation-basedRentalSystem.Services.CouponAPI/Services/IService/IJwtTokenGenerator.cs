using EVStation_basedRentalSystem.Services.AuthAPI.Models;
using System.Security.Claims;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service.IService
{
    public interface IJwtTokenGenerator
    {
        
        string GenerateAccessToken(ApplicationUser user, IList<string> roles);
        string GenerateRefreshToken(); 
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
      
    }
}
