using EVStation_basedRentalSystem.Services.AuthAPI.Clients;
using EVStation_basedRentalSystem.Services.AuthAPI.Data;
using EVStation_basedRentalSystem.Services.AuthAPI.Models;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Request;
using EVStation_basedRentalSystem.Services.AuthAPI.Models.Dto.Response;
using EVStation_basedRentalSystem.Services.AuthAPI.Service.IService;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace EVStation_basedRentalSystem.Services.AuthAPI.Service
{
    public class RegistrationService : IRegistrationService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly UserServiceClient _userServiceClient;

        public RegistrationService(AppDbContext db, UserManager<ApplicationUser> userManager, UserServiceClient userServiceClient)
        {
            _db = db;
            _userManager = userManager;
            _userServiceClient = userServiceClient;
        }



        /// <summary>
        /// Register a new user
        /// </summary>
        public async Task<RegistrationResponseDto> RegisterUserAsync(RegistrationRequestDto registrationRequestDto)
        {
            // 1️⃣ Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(registrationRequestDto.Email);
            if (existingUser != null)
                return new RegistrationResponseDto
                {
                    User = null,
                    Message = "Email is already registered."
                };

            // 2️⃣ Create new user in Identity
            var user = new ApplicationUser
            {
                UserName = registrationRequestDto.Email,
                Email = registrationRequestDto.Email,
                NormalizedEmail = registrationRequestDto.Email.ToUpper(),
                Name = registrationRequestDto.Name,
                PhoneNumber = registrationRequestDto.PhoneNumber,
                SecurityStamp = Guid.NewGuid().ToString(),
                IsApproved = false
            };

            var result = await _userManager.CreateAsync(user, registrationRequestDto.Password);
            if (!result.Succeeded)
                return new RegistrationResponseDto
                {
                    User = null,
                    Message = result.Errors.FirstOrDefault()?.Description ?? "Registration failed"
                };

            // 3️⃣ Assign default role
            await _userManager.AddToRoleAsync(user, "Renter");

            // 4️⃣ Sync new user to UserAPI using the same ID
            var userDto = new UserDto
            {
                ID = user.Id, // same ID from Auth
                Email = user.Email,
                Name = user.Name,
                PhoneNumber = user.PhoneNumber
            };

            try
            {
                // send to UserAPI through HttpClient
                await _userServiceClient.CreateUserAsync(userDto);
            }
            catch (Exception ex)
            {
                // optional: log the error
                Console.WriteLine($"⚠️ Failed to sync user to UserAPI: {ex.Message}");
            }

            // 5️⃣ Return success response
            return new RegistrationResponseDto
            {
                User = userDto,
                Message = "Registration successful. Your account will be verified by Admin before renting cars."
            };
        }


        public async Task<string> ForgotPasswordAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return "User not found";

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

            // TODO: Send the resetToken via email (MailService)
            // await _mailService.SendResetPasswordEmail(user.Email, resetToken);

            return "Password reset link sent";
        }

        public async Task<string> ResetPasswordAsync(string resetKey)
        {
            throw new NotImplementedException("Use ResetPassword with Email, Token, and NewPassword DTO for security.");
        }

        public async Task<string> ChangePasswordAsync(ChangePasswordRequestDto changePasswordRequest)
        {
            var user = await _userManager.FindByIdAsync(changePasswordRequest.UserId);
            if (user == null)
                return "User not found";

            var result = await _userManager.ChangePasswordAsync(
                user,
                changePasswordRequest.CurrentPassword,
                changePasswordRequest.NewPassword
            );

            if (!result.Succeeded)
                return $"Password change failed: {string.Join(", ", result.Errors.Select(e => e.Description))}";

            return "Password changed successfully";
        }
    }
}
