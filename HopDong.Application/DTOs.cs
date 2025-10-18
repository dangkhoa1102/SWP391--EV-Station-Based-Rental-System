namespace HopDong.Application;

// DTO này chứa tất cả dữ liệu động cần thiết để điền vào file Word
public record TaoHopDongDto(
    string SoHopDong,
    string NgayKy,
    string ThangKy,
    string NamKy,
    ThongTinBenA BenA,
    ThongTinXe Xe,
    ThongTinGiaThue GiaThue,
    string ThoiHanThueSo,
    string ThoiHanThueChu,
    int ThoiHanThue, // Số ngày thuê, ví dụ: 12
    string DonViThoiHan, // Ví dụ: "ngay" 
    ThongTinGPLX GPLX
);

public record ThongTinBenA(
    string HoTen,
    string NamSinh,
    string CccdHoacHoChieu,
    string HoKhauThuongTru
);

public record ThongTinXe(
    string NhanHieu,
    string BienSo,
    string LoaiXe,
    string MauSon,
    string ChoNgoi,
    string XeDangKiHan
);

public record ThongTinGiaThue(
    string GiaThueSo,
    string GiaThueChu,
    string PhuongThucThanhToan,
    string NgayThanhToan
);

public record ThongTinGPLX(
    string Hang,
    string So,
    string HanSuDung
);

// --- DTO cho luồng mới ---
public record HopDongXacNhanDto(string SoHopDong, string NguoiKy, DateTime? NgayTao, string NoiDungHtml);
public record KyHopDongRequestDto(string Token);
public record GuiEmailRequestDto(string Email);
