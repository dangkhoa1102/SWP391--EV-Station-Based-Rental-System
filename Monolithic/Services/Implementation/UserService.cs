using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Monolithic.Data;
using Monolithic.Models;
using Monolithic.Services.Interfaces;

namespace Monolithic.Services.Implementation
{
    public class UserService : IUserService
    {
        private readonly EVStationBasedRentalSystemDbContext _context;

        public UserService(EVStationBasedRentalSystemDbContext context)
        {
            _context = context;
        }

        public async Task<User?> FindByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> FindByIdAsync(string id)
        {
            if (Guid.TryParse(id, out var userId))
            {
                return await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            }
            return null;
        }

        public async Task<bool> CreateUserAsync(User user, string password)
        {
            try
            {
                user.PasswordHash = HashPassword(password);
                if (user.UserId == Guid.Empty)
                {
                    user.UserId = Guid.NewGuid();
                }
                user.CreatedAt = DateTime.UtcNow;

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public Task<bool> CheckPasswordAsync(User user, string password)
        {
            return Task.FromResult(VerifyPassword(password, user.PasswordHash ?? ""));
        }

        public async Task<bool> ChangePasswordAsync(User user, string currentPassword, string newPassword)
        {
            if (!VerifyPassword(currentPassword, user.PasswordHash ?? ""))
                return false;

            user.PasswordHash = HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateUserAsync(User user)
        {
            try
            {
                user.UpdatedAt = DateTime.UtcNow;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<(List<User> users, int total)> GetUsersAsync(int page, int pageSize, string? search = null, string? role = null, bool? isActive = null)
        {
            var query = _context.Users.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(u => 
                    u.FirstName.ToLower().Contains(searchLower) ||
                    u.LastName.ToLower().Contains(searchLower) ||
                    u.Email!.ToLower().Contains(searchLower) ||
                    u.PhoneNumber!.Contains(searchLower)
                );
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.UserRole == role);
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            var total = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (users, total);
        }

        public async Task<List<User>> SearchUsersByNameAsync(string searchTerm)
        {
            var searchLower = searchTerm.ToLower();
            return await _context.Users
                .Where(u => u.IsActive && (
                    u.FirstName.ToLower().Contains(searchLower) ||
                    u.LastName.ToLower().Contains(searchLower) ||
                    u.Email!.ToLower().Contains(searchLower)
                ))
                .OrderBy(u => u.FirstName)
                .Take(20)
                .ToListAsync();
        }

        public async Task<bool> DeactivateUserAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
                return false;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
            if (user == null)
                return false;

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActivateUserAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
                return false;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
            if (user == null)
                return false;

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateUserRoleAsync(string userId, string newRole)
        {
            if (!Guid.TryParse(userId, out var userGuid))
                return false;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userGuid);
            if (user == null)
                return false;

            user.UserRole = newRole;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DTOs.Common.ResponseDto<string>> AssignStaffToStationAsync(string staffId, Guid? stationId)
        {
            if (!Guid.TryParse(staffId, out var staffGuid))
                return DTOs.Common.ResponseDto<string>.Failure("staffId không hợp lệ");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == staffGuid);
            if (user == null)
                return DTOs.Common.ResponseDto<string>.Failure("Không tìm thấy nhân viên");

            // Chỉ cho phép gán station cho nhân viên Station Staff
            if (user.UserRole != Common.AppRoles.StationStaff)
                return DTOs.Common.ResponseDto<string>.Failure("Chỉ áp dụng cho nhân viên có vai trò Station Staff");

            if (stationId.HasValue)
            {
                var stationExists = await _context.Stations.AnyAsync(s => s.StationId == stationId.Value && s.IsActive);
                if (!stationExists)
                    return DTOs.Common.ResponseDto<string>.Failure("Không tìm thấy trạm");
            }

            user.StationId = stationId;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return DTOs.Common.ResponseDto<string>.Success(stationId.HasValue 
                ? "Gán nhân viên vào trạm thành công" 
                : "Đã bỏ gán nhân viên khỏi trạm");
        }

        public async Task<int> GetTotalUsersCountAsync()
        {
            return await _context.Users.CountAsync(u => u.IsActive);
        }

        public async Task<Dictionary<string, int>> GetUserStatisticsByRoleAsync()
        {
            return await _context.Users
                .Where(u => u.IsActive)
                .GroupBy(u => u.UserRole)
                .Select(g => new { Role = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Role, x => x.Count);
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var salt = Guid.NewGuid().ToString();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + salt));
            return Convert.ToBase64String(hashedBytes) + ":" + salt;
        }

        private static bool VerifyPassword(string password, string hashedPassword)
        {
            if (string.IsNullOrEmpty(hashedPassword))
                return false;

            var parts = hashedPassword.Split(':');
            if (parts.Length != 2)
                return false;

            var hash = parts[0];
            var salt = parts[1];

            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + salt));
            var newHash = Convert.ToBase64String(hashedBytes);

            return hash == newHash;
        }
    }
}
