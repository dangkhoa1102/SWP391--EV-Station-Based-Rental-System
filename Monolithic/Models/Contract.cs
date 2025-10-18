using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Monolithic.Models;

public class Contract
{
    public Guid Id { get; set; }
    public string SoHopDong { get; set; }
    //public DateTime NgayKy { get; set; }
    // --- CÁC KHÓA NGO?I QUAN TR?NG ---
    public Guid BookingId { get; set; }   // Liên k?t t?i l?n ??t xe
    public Guid UserId { get; set; }      // Ng??i thuê (Bên A)
    public Guid CarId { get; set; }       // Xe ???c thuê
    public string HoTenBenA { get; set; }
    public string BienSoXe { get; set; }

    // --- Các tr??ng m?i cho quy trình ký tên ---
    public ContractStatus Status { get; set; } = ContractStatus.Pending;
    public string? ConfirmationToken { get; set; } // Token duy nh?t g?i qua email
    public DateTime? TokenExpiry { get; set; }     // Th?i gian token h?t h?n
    public DateTime? NgayTao { get; set; }          // Th?i ?i?m h?p ??ng ???c t?o
    public DateTime? NgayKy { get; set; }           // Th?i ?i?m h?p ??ng ???c ký
    public DateTime? NgayHetHan { get; set; }
    public bool IsDeleted { get; set; } = false;

    // THÊM DÒNG NÀY VÀO
    public virtual Booking Booking { get; set; } // Navigation property
}

public enum ContractStatus
{
    Pending,
    Signed,
    Expired
}
