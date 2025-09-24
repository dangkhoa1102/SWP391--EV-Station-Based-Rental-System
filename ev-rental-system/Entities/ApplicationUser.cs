using Microsoft.AspNetCore.Identity;

namespace ev_rental_system.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; }
        public string Address { get; set; }
    }
}
