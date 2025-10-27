using HopDong.Application.Services.IServices;
using HopDong.Domain.Entities;
using HopDong.Domain.Interfaces;
using Microsoft.Extensions.Hosting;
using Xceed.Words.NET;

namespace HopDong.Application.Services;

public class HopDongFileService : IHopDongFileService
{
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IHostEnvironment _env;

    public HopDongFileService(IHopDongRepository hopDongRepository, IHostEnvironment env)
    {
        _hopDongRepository = hopDongRepository;
        _env = env;
    }

    public async Task<MemoryStream> TaoHopDongFileAsync(TaoHopDongDto request)
    {
        // Bước 1: (Tùy chọn) Lưu thông tin vào database
        var hopDongEntity = new HopDongThueXe
        {
            Id = Guid.NewGuid(),
            SoHopDong = request.SoHopDong,
            NgayKy = DateTime.UtcNow,
            HoTenBenA = request.BenA.HoTen,
            BienSoXe = request.Xe.BienSo
        };
        await _hopDongRepository.AddAsync(hopDongEntity);

        // Bước 2: Tạo file Word từ template
        var templatePath = Path.Combine(_env.ContentRootPath, "Templates", "hopdongthuexe.docx");
        using var document = DocX.Load(templatePath);

        // Thay thế các placeholder
        document.ReplaceText("{{so_hop_dong}}", request.SoHopDong);
        document.ReplaceText("{{ngay_ky}}", request.NgayKy);
        document.ReplaceText("{{thang_ky}}", request.ThangKy);
        document.ReplaceText("{{nam_ky}}", request.NamKy);

        document.ReplaceText("{{HO_TEN_BEN_A}}", request.BenA.HoTen);
        document.ReplaceText("{{nam_sinh_ben_a}}", request.BenA.NamSinh);
        document.ReplaceText("{{cccd_hoac_ho_chieu_ben_a}}", request.BenA.CccdHoacHoChieu);
        document.ReplaceText("{{ho_khau_thuong_tru}}", request.BenA.HoKhauThuongTru);

        document.ReplaceText("{{nhan_hieu}}", request.Xe.NhanHieu);
        document.ReplaceText("{{bien_so}}", request.Xe.BienSo);
        document.ReplaceText("{{loai_xe}}", request.Xe.LoaiXe);
        document.ReplaceText("{{mau_son}}", request.Xe.MauSon);
        document.ReplaceText("{{cho_ngoi}}", request.Xe.ChoNgoi);
        document.ReplaceText("{{xe_dang_ki_han}}", request.Xe.XeDangKiHan);

        document.ReplaceText("{{gplx_hang}}", request.GPLX.Hang);
        document.ReplaceText("{{gplx_so}}", request.GPLX.So);
        document.ReplaceText("{{gplx_han_su_dung}}", request.GPLX.HanSuDung);

        document.ReplaceText("{{thoi_han_thue_so}}", request.ThoiHanThueSo);
        document.ReplaceText("{{thoi_han_thue_chu}}", request.ThoiHanThueChu);

        document.ReplaceText("{{gia_thue_so}}", request.GiaThue.GiaThueSo);
        document.ReplaceText("{{gia_thue_chu}}", request.GiaThue.GiaThueChu);
        document.ReplaceText("{{phuong_thuc_thanh_toan}}", request.GiaThue.PhuongThucThanhToan);
        document.ReplaceText("{{ngay_thanh_toan}}", request.GiaThue.NgayThanhToan);

        var memoryStream = new MemoryStream();
        document.SaveAs(memoryStream);
        memoryStream.Position = 0;

        return memoryStream;
    }
}
