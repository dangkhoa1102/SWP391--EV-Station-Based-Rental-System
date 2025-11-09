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

        // Năm sinh (cho hợp đồng)
        public string? YearOfBirth { get; set; }

        // Số CCCD/Hộ chiếu (cho hợp đồng)
        [StringLength(50)]
        public string? IdentityNumber { get; set; }

        public string? DriverLicenseNumber { get; set; }

        public DateOnly? DriverLicenseExpiry { get; set; }

        // Hạng GPLX (A1, A2, B1, B2, C, D, E, F...)
        [StringLength(10)]
        public string? DriverLicenseClass { get; set; }

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

        // --- Ảnh CCCD ---
        public string? CccdImageUrl_Front { get; set; }
        public string? CccdImagePublicId_Front { get; set; }
        public string? CccdImageUrl_Back { get; set; }
        public string? CccdImagePublicId_Back { get; set; }

        // --- Ảnh GPLX ---
        public string? GplxImageUrl_Front { get; set; }
        public string? GplxImagePublicId_Front { get; set; }
        public string? GplxImageUrl_Back { get; set; }
        public string? GplxImagePublicId_Back { get; set; }

        // Có thể thêm trạng thái xác thực
        public bool IsVerified { get; set; } = false;

        // Station assignment (for station staff)
        public Guid? StationId { get; set; }
        public virtual Station? Station { get; set; }

        // Navigation properties
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    }
}