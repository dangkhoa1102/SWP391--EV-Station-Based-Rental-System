
namespace EVStation_basedRentalSystem.Services.AuthAPI.Models
{
    public class Token
    {
        public string UserId { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }
        public bool IsActive => RevokedAt == null && DateTime.UtcNow <= ExpiresAt;
    }
}
