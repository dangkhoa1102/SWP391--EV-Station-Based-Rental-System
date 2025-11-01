using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models
{
    // Contract Status Enum
    public enum ContractStatus
    {
        Pending = 0,      // Chờ ký
        Signed = 1,       // Đã ký
        Expired = 2       // Hết hạn
    }

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

        // --- HopDong Specific Fields ---
        [StringLength(100)]
        public string? SoHopDong { get; set; } // Số hợp đồng

        [StringLength(255)]
        public string? HoTenBenA { get; set; } // Họ tên bên A (người thuê)

        [StringLength(50)]
        public string? BienSoXe { get; set; } // Biển số xe

        // Status của hợp đồng (Pending, Signed, Expired)
        public ContractStatus Status { get; set; } = ContractStatus.Pending;

        // Token xác nhận duy nhất gửi qua email
        [StringLength(256)]
        public string? ConfirmationToken { get; set; }

        // Thời gian token hết hạn
        public DateTime? TokenExpiry { get; set; }

        // Thời điểm hợp đồng được tạo
        public DateTime? NgayTao { get; set; }

        // Thời điểm hợp đồng được ký
        public DateTime? NgayKy { get; set; }

        // Thời điểm hợp đồng hết hạn
        public DateTime? NgayHetHan { get; set; }

        // Xóa mềm
        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
