using Microsoft.AspNetCore.Identity;

namespace APIs.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; }
        public ICollection<RefreshToken> RefreshTokens { get; set; }
    }
}
