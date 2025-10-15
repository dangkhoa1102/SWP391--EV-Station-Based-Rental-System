using Monolithic.DTOs.Common;
using Monolithic.Models;

namespace Monolithic.Services.Interfaces
{
    public interface IUserService
    {
        // Basic user operations
        Task<User?> FindByEmailAsync(string email);
        Task<User?> FindByIdAsync(string id);
        Task<bool> CreateUserAsync(User user, string password);
        Task<bool> CheckPasswordAsync(User user, string password);
        Task<bool> ChangePasswordAsync(User user, string currentPassword, string newPassword);
        Task<bool> UpdateUserAsync(User user);
        
        // Extended user operations
        Task<(List<User> users, int total)> GetUsersAsync(int page, int pageSize, string? search = null, string? role = null, bool? isActive = null);
        Task<List<User>> SearchUsersByNameAsync(string searchTerm);
        Task<bool> DeactivateUserAsync(string userId);
        Task<bool> ActivateUserAsync(string userId);
        Task<bool> UpdateUserRoleAsync(string userId, string newRole);
        Task<int> GetTotalUsersCountAsync();
        Task<Dictionary<string, int>> GetUserStatisticsByRoleAsync();
    }
}
