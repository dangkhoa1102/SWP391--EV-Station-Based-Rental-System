using EVStation_basedRentalSystem.Services.AuthAPI.Models;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Services.IService;
using Microsoft.AspNetCore.Identity;
using System;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service
{
    public class AuthorizeService : IAuthorizeService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AuthorizeService(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<string> AssignRoleAsync(AssignRoleRequest request)
        {
            // Find the user
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
                throw new KeyNotFoundException($"User with ID '{request.UserId}' not found.");

            // Check if role exists
            if (!await _roleManager.RoleExistsAsync(request.Role))
                throw new KeyNotFoundException($"Role '{request.Role}' does not exist.");

            // Check if user already has the role
            if (await _userManager.IsInRoleAsync(user, request.Role))
                return $"User already has the role '{request.Role}'.";

            // Assign the role
            var result = await _userManager.AddToRoleAsync(user, request.Role);
            if (!result.Succeeded)
                throw new InvalidOperationException($"Failed to assign role '{request.Role}': {string.Join(", ", result.Errors)}");

            return $"Role '{request.Role}' assigned to user '{user.Email}' successfully.";
        }

        public async Task<string> RevokeRoleAsync(AssignRoleRequest request)
        {
            // Find the user
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
                throw new KeyNotFoundException($"User with ID '{request.UserId}' not found.");

            // Check if role exists
            if (!await _roleManager.RoleExistsAsync(request.Role))
                throw new KeyNotFoundException($"Role '{request.Role}' does not exist.");

            // Check if user has the role
            if (!await _userManager.IsInRoleAsync(user, request.Role))
                return $"User does not have the role '{request.Role}'.";

            // Remove the role
            var result = await _userManager.RemoveFromRoleAsync(user, request.Role);
            if (!result.Succeeded)
                throw new InvalidOperationException($"Failed to revoke role '{request.Role}': {string.Join(", ", result.Errors)}");

            return $"Role '{request.Role}' revoked from user '{user.Email}' successfully.";
        }
    }
}
