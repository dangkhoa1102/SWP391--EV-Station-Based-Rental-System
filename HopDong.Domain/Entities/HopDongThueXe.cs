namespace HopDong.Domain.Entities;

public class HopDongThueXe
{
    public Guid Id { get; set; }
    public string SoHopDong { get; set; }
    //public DateTime NgayKy { get; set; }
    public string HoTenBenA { get; set; }
    public string BienSoXe { get; set; }

    // --- Các trường mới cho quy trình ký tên ---
    public HopDongStatus Status { get; set; } = HopDongStatus.Pending;
    public string? ConfirmationToken { get; set; } // Token duy nhất gửi qua email
    public DateTime? TokenExpiry { get; set; }     // Thời gian token hết hạn
    public DateTime? NgayTao { get; set; }          // Thời điểm hợp đồng được tạo
    public DateTime? NgayKy { get; set; }           // Thời điểm hợp đồng được ký
    public DateTime? NgayHetHan { get; set; }
    public bool IsDeleted { get; set; } = false;
}

public enum HopDongStatus
{
    Pending,
    Signed,
    Expired
}
