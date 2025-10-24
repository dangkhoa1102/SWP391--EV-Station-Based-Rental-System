using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    public class Contract
    {
        [Key]
        public Guid ContractId { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public Guid RenterId { get; set; }

        public Guid? StaffId { get; set; }
        // Contract content (plain text) and its hash for tamper-proof audit
        [Required]
        [StringLength(4000)]
        public string ContractContent { get; set; } = string.Empty;

        [Required]
        [StringLength(128)]
        public string ContractContentHash { get; set; } = string.Empty;

        // Signature type: e.g. "EmailConfirmation", "TypedName"
        [Required]
        [StringLength(50)]
        public string SignatureType { get; set; } = "EmailConfirmation";

        // Signature value depends on SignatureType (e.g. typed full name)
        [StringLength(256)]
        public string? SignatureValue { get; set; }

        // Email used for confirmation (if applicable)
        [StringLength(256)]
        public string? SignerEmail { get; set; }

        // Store only hash of confirmation token
        [StringLength(128)]
        public string? ConfirmationTokenHash { get; set; }

        public DateTime? TokenExpiresAt { get; set; }

        public bool IsConfirmed { get; set; } = false;
        public DateTime? ConfirmedAt { get; set; }

        [StringLength(100)]
        public string? ConfirmedFromIp { get; set; }

        [StringLength(512)]
        public string? ConfirmedUserAgent { get; set; }

        // Thông tin ký hợp đồng
        [StringLength(500)]
        public string? StaffSignature { get; set; } // Chữ ký của staff

        [StringLength(500)]
        public string? CustomerSignature { get; set; } // Chữ ký của khách hàng

        public DateTime? SignedAt { get; set; } // Thời gian ký hợp đồng

        [StringLength(1000)]
        public string? ContractNotes { get; set; } // Ghi chú về hợp đồng
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
