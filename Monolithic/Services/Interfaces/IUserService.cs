using Monolithic.Models;

namespace Monolithic.Services.Interfaces
{
    public interface IUserService
    {
        Task<User?> FindByEmailAsync(string email);
        Task<User?> FindByIdAsync(string id);
        Task<bool> CreateUserAsync(User user, string password);
        Task<bool> CheckPasswordAsync(User user, string password);
        Task<bool> ChangePasswordAsync(User user, string currentPassword, string newPassword);
        Task<bool> UpdateUserAsync(User user);
    }
}