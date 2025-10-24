using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace Monolithic.Models
{
    public class User
    {
        public Guid UserId { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(256)]
        public string UserName { get; set; } = string.Empty;
        
        [StringLength(256)]
        public string? Email { get; set; }

        public string? PasswordHash { get; set; }

        public string? PhoneNumber { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        public string? Address { get; set; }

        public DateOnly DateOfBirth { get; set; }

        public string? DriverLicenseNumber { get; set; }

        public DateOnly? DriverLicenseExpiry { get; set; }

        [Required]
        public string UserRole { get; set; } = "EV Renter";

        // JWT Refresh Token
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }

        // Account status
        public bool IsActive { get; set; } = true;

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Convenience property
        public string FullName => $"{FirstName} {LastName}".Trim();

        // --- ?nh CCCD ---
        public string? CccdImageUrl_Front { get; set; }
        public string? CccdImagePublicId_Front { get; set; }
        public string? CccdImageUrl_Back { get; set; }
        public string? CccdImagePublicId_Back { get; set; }

        // --- ?nh GPLX ---
        // (GPLX ? VN th??ng ch? c?n m?t tr??c, nh?ng ta c? làm 2 m?t cho ??y ??)
        public string? GplxImageUrl_Front { get; set; }
        public string? GplxImagePublicId_Front { get; set; }
        public string? GplxImageUrl_Back { get; set; }
        public string? GplxImagePublicId_Back { get; set; }

        // Có th? thêm tr?ng thái xác th?c
        public bool IsVerified { get; set; } = false;

        // Navigation properties
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    }
}