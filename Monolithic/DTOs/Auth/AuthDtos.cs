using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Monolithic.Common;

namespace Monolithic.DTOs.Auth
{
    public class LoginRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public UserDto User { get; set; } = new();
    }

    public class RegisterRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }
    }
    public class VerifyEmailDto { public string Email { get; set; } = null!; public string Otp { get; set; } = null!; }
    public class ForgotPasswordDto { public string Email { get; set; } = null!; }
    public class ResetPasswordDto { public string Email { get; set; } = null!; public string Otp { get; set; } = null!; [Required]
        [MinLength(6)] public string NewPassword { get; set; } = null!; }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? YearOfBirth { get; set; }
        public string? IdentityNumber { get; set; }
        public string? DriverLicenseNumber { get; set; }
        public DateOnly? DriverLicenseExpiry { get; set; }
        public string? DriverLicenseClass { get; set; }
        public string UserRole { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedAt { get; set; }
        [JsonConverter(typeof(NullableDateTimeConverter))]
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; }
        public Guid? StationId { get; set; }
        
        // Document URLs (for profile viewing)
        public string? CccdImageUrl_Front { get; set; }
        public string? CccdImageUrl_Back { get; set; }
        public string? GplxImageUrl_Front { get; set; }
        public string? GplxImageUrl_Back { get; set; }
    }

    public class UpdateUserDto
    {
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string? FirstName { get; set; }

        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string? LastName { get; set; }

        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }

        [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
        public string? Address { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        [StringLength(4, MinimumLength = 4, ErrorMessage = "Year of birth must be 4 digits")]
        [RegularExpression(@"^\d{4}$", ErrorMessage = "Year of birth must be a valid year (e.g., 1990)")]
        public string? YearOfBirth { get; set; }

        [StringLength(50, ErrorMessage = "Identity number cannot exceed 50 characters")]
        public string? IdentityNumber { get; set; }

        [StringLength(50, ErrorMessage = "Driver license number cannot exceed 50 characters")]
        public string? DriverLicenseNumber { get; set; }

        public DateOnly? DriverLicenseExpiry { get; set; }

        [StringLength(10, ErrorMessage = "Driver license class cannot exceed 10 characters")]
        public string? DriverLicenseClass { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UserDocumentsDto
    {
        public string? CccdImageUrl_Front { get; set; }
        public string? CccdImageUrl_Back { get; set; }
        public string? GplxImageUrl_Front { get; set; }
        public string? GplxImageUrl_Back { get; set; }
        public bool IsVerified { get; set; }
    }
}