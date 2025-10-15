using Microsoft.EntityFrameworkCore;
using Monolithic.Common;
using Monolithic.Data;
using Monolithic.DTOs.Auth;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace Monolithic.Services.Implementation
{
    public class AuthServiceImpl : IAuthService
    {
        private readonly EVStationBasedRentalSystemDbContext _dbContext;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthServiceImpl(EVStationBasedRentalSystemDbContext dbContext, IJwtTokenService jwtTokenService)
        {
            _dbContext = dbContext;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<ResponseDto<LoginResponseDto>> LoginAsync(LoginRequestDto request)
        {
            try
            {
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);
                if (user == null)
                {
                    return ResponseDto<LoginResponseDto>.Failure("Invalid email or password");
                }

                // Verify password
                if (!VerifyPassword(request.Password, user.PasswordHash ?? ""))
                {
                    return ResponseDto<LoginResponseDto>.Failure("Invalid email or password");
                }

                // Generate tokens
                var roles = new List<string> { user.UserRole };
                var accessToken = _jwtTokenService.GenerateAccessToken(user.UserId.ToString(), user.Email ?? "", roles);
                var refreshToken = _jwtTokenService.GenerateRefreshToken();
                await _jwtTokenService.SaveRefreshTokenAsync(user.UserId.ToString(), refreshToken);

                var response = new LoginResponseDto
                {
                    Token = accessToken,
                    RefreshToken = refreshToken,
                    User = new UserDto
                    {
                        Id = user.UserId.ToString(),
                        Email = user.Email ?? "",
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        PhoneNumber = user.PhoneNumber,
                        UserRole = user.UserRole,
                        CreatedAt = user.CreatedAt,
                        UpdatedAt = user.UpdatedAt,
                        IsActive = user.IsActive
                    }
                };

                return ResponseDto<LoginResponseDto>.Success(response, "Login successful");
            }
            catch (Exception ex)
            {
                return ResponseDto<LoginResponseDto>.Failure($"Login failed: {ex.Message}");
            }
        }

        public async Task<ResponseDto<UserDto>> RegisterAsync(RegisterRequestDto request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (existingUser != null)
                {
                    return ResponseDto<UserDto>.Failure("User with this email already exists");
                }

                var existingUsername = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserName == request.Email);
                if (existingUsername != null)
                {
                    return ResponseDto<UserDto>.Failure("Username already exists");
                }

                // Parse FullName to FirstName and LastName
                var nameParts = request.FullName.Trim().Split(' ', 2);
                var firstName = nameParts.Length > 0 ? nameParts[0] : request.FullName;
                var lastName = nameParts.Length > 1 ? nameParts[1] : "";

                // Create new user
                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    UserName = request.Email,
                    Email = request.Email,
                    FirstName = firstName,
                    LastName = lastName,
                    PhoneNumber = request.PhoneNumber,
                    PasswordHash = HashPassword(request.Password),
                    UserRole = AppRoles.EVRenter, // Default role for new registrations
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync();

                var userDto = new UserDto
                {
                    Id = user.UserId.ToString(),
                    Email = user.Email ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    UserRole = user.UserRole,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    IsActive = user.IsActive
                };

                return ResponseDto<UserDto>.Success(userDto, "User registered successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<UserDto>.Failure($"Registration failed: {ex.Message}");
            }
        }

        public async Task<ResponseDto<string>> LogoutAsync(string userId)
        {
            try
            {
                await _jwtTokenService.RevokeRefreshTokenAsync(userId);
                return ResponseDto<string>.Success("", "Logout successful");
            }
            catch (Exception ex)
            {
                return ResponseDto<string>.Failure($"Logout failed: {ex.Message}");
            }
        }

        public async Task<ResponseDto<string>> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                // Find user by refresh token
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.IsActive);
                if (user == null)
                {
                    return ResponseDto<string>.Failure("Invalid refresh token");
                }

                // Validate refresh token
                var isValid = await _jwtTokenService.ValidateRefreshTokenAsync(user.UserId.ToString(), refreshToken);
                if (!isValid)
                {
                    return ResponseDto<string>.Failure("Refresh token expired or invalid");
                }

                // Generate new access token
                var roles = new List<string> { user.UserRole };
                var newAccessToken = _jwtTokenService.GenerateAccessToken(user.UserId.ToString(), user.Email ?? "", roles);

                return ResponseDto<string>.Success(newAccessToken, "Token refreshed successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<string>.Failure($"Token refresh failed: {ex.Message}");
            }
        }

        public async Task<ResponseDto<UserDto>> GetCurrentUserAsync(string userId)
        {
            try
            {
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId.ToString() == userId && u.IsActive);
                if (user == null)
                {
                    return ResponseDto<UserDto>.Failure("User not found");
                }

                var userDto = new UserDto
                {
                    Id = user.UserId.ToString(),
                    Email = user.Email ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    UserRole = user.UserRole,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    IsActive = user.IsActive
                };

                return ResponseDto<UserDto>.Success(userDto);
            }
            catch (Exception ex)
            {
                return ResponseDto<UserDto>.Failure($"Failed to get user: {ex.Message}");
            }
        }

        public async Task<ResponseDto<UserDto>> UpdateUserAsync(string userId, UpdateUserDto request)
        {
            try
            {
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId.ToString() == userId && u.IsActive);
                if (user == null)
                {
                    return ResponseDto<UserDto>.Failure("User not found");
                }

                if (!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName;
                if (!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName;
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber)) user.PhoneNumber = request.PhoneNumber;

                user.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();

                var userDto = new UserDto
                {
                    Id = user.UserId.ToString(),
                    Email = user.Email ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    UserRole = user.UserRole,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    IsActive = user.IsActive
                };

                return ResponseDto<UserDto>.Success(userDto, "User updated successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<UserDto>.Failure($"Update failed: {ex.Message}");
            }
        }

        public async Task<ResponseDto<string>> ChangePasswordAsync(string userId, ChangePasswordDto request)
        {
            try
            {
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId.ToString() == userId && u.IsActive);
                if (user == null)
                {
                    return ResponseDto<string>.Failure("User not found");
                }

                // Verify current password
                if (!VerifyPassword(request.CurrentPassword, user.PasswordHash ?? ""))
                {
                    return ResponseDto<string>.Failure("Current password is incorrect");
                }

                // Update password
                user.PasswordHash = HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();

                return ResponseDto<string>.Success("", "Password changed successfully");
            }
            catch (Exception ex)
            {
                return ResponseDto<string>.Failure($"Password change failed: {ex.Message}");
            }
        }

        // Helper methods for password hashing
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string password, string hashedPassword)
        {
            var hash = HashPassword(password);
            return hash == hashedPassword;
        }
    }
}

