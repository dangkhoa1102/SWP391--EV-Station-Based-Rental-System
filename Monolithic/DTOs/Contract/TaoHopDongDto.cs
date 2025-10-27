namespace Monolithic.DTOs.Contract
{
    /// <summary>
    /// DTO ch?a t?t c? d? li?u ??ng c?n thi?t ?? ?i?n vào file Word h?p ??ng
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
}
