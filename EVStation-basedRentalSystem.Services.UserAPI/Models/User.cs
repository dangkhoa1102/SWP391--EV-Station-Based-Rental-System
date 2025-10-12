using System.ComponentModel.DataAnnotations;
using EVStation_basedRentalSystem.Services.UserAPI.Utils.enums;

namespace EVStation_basedRentalSystem.Services.UserAPI.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } 

        [Required]
        [MaxLength(100)]
        public string Username { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; }

        [MaxLength(20)]
        public string PhoneNumber { get; set; }

        public UserStatus Status { get; set; } = UserStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
