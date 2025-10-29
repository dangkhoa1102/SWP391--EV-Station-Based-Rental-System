namespace Monolithic.DTOs.Contract
{
    /// <summary>
    /// DTO ?? t?o h?p ??ng thuê xe ki?u HopDong
    /// Ch?a t?t c? d? li?u ??ng c?n thi?t ?? ?i?n vào file Word template
    /// </summary>
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
        int ThoiHanThue, // S? ngày/tháng thuê
        string DonViThoiHan, // "ngay" ho?c "thang"
        ThongTinGPLX GPLX
    );

    /// <summary>
    /// Thông tin bên A (ng??i thuê)
    /// </summary>
    public record ThongTinBenA(
        string HoTen,
        string NamSinh,
        string CccdHoacHoChieu,
        string HoKhauThuongTru
    );

    /// <summary>
    /// Thông tin v? xe
    /// </summary>
    public record ThongTinXe(
        string NhanHieu,
        string BienSo,
        string LoaiXe,
        string MauSon,
        string ChoNgoi,
        string XeDangKiHan
    );

    /// <summary>
    /// Thông tin giá thuê và thanh toán
    /// </summary>
    public record ThongTinGiaThue(
        string GiaThueSo,
        string GiaThueChu,
        string PhuongThucThanhToan,
        string NgayThanhToan
    );

    /// <summary>
    /// Thông tin gi?y phép lái xe
    /// </summary>
    public record ThongTinGPLX(
        string Hang,
        string So,
        string HanSuDung
    );

    /// <summary>
    /// DTO cho lu?ng xác nh?n h?p ??ng
    /// </summary>
    public record HopDongXacNhanDto(
        string SoHopDong,
        string NguoiKy,
        DateTime? NgayTao,
        string NoiDungHtml
    );

    /// <summary>
    /// DTO ?? xác nh?n ký h?p ??ng
    /// </summary>
    public record KyHopDongRequestDto(string Token);

    /// <summary>
    /// DTO ?? g?i email xác nh?n h?p ??ng
    /// </summary>
    public record GuiEmailRequestDto(string Email);
}
