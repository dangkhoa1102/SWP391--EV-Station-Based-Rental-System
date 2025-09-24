using APIs.Entities;
using Microsoft.AspNetCore.Identity;

namespace ev_rental_system.Services
{
    public class DataSeeder
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public DataSeeder(RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
        {
            _roleManager = roleManager;
            _userManager = userManager;
        }

        public async Task SeedAsync()
        {
            var roles = new[] { "Renter", "Staff", "Admin" };
            foreach (var role in roles)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                    await _roleManager.CreateAsync(new IdentityRole(role));
            }

            var adminUser = new ApplicationUser
            {
                UserName = "admin@ev.com",
                Email = "admin@ev.com",
                EmailConfirmed = true
            };

            if (await _userManager.FindByEmailAsync(adminUser.Email) == null)
            {
                await _userManager.CreateAsync(adminUser, "Admin@123");
                await _userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }
}
