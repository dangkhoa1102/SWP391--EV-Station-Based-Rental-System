using Microsoft.AspNetCore.Identity;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; }
        public DateTime? LastLogin { get; set; }
       public bool IsApproved { get; set; } = false; // default: not approved

        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
    }
}
