using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using OpenXmlPowerTools;
using System.Text;
using Xceed.Words.NET;
using System.Globalization;
using Microsoft.EntityFrameworkCore;

namespace Monolithic.Services.Implementation;

public class ContractServiceImpl : IContractService
{
    private readonly IContractRepository _contractRepo;
    private readonly IBookingRepository _bookingRepo;
    private readonly IEmailService _emailService;
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _configuration;

    public ContractServiceImpl(
        IContractRepository contractRepo, 
        IBookingRepository bookingRepo,
        IEmailService emailService, 
        IHostEnvironment env,
        IConfiguration configuration)
    {
        _contractRepo = contractRepo;
        _bookingRepo = bookingRepo;
        _emailService = emailService;
        _env = env;
        _configuration = configuration;
    }

    /// <summary>
    /// API MỚI: Tạo hợp đồng tự động từ thông tin Booking
    /// </summary>
    public async Task<ResponseDto<ContractResponseDto>> TaoHopDongTuBookingAsync(Guid bookingId)
    {
        try
        {
            // 1. Lấy thông tin booking (kèm User, Car, Station)
            var booking = await _bookingRepo.GetBookingWithDetailsAsync(bookingId);
            if (booking == null)
            {
                return ResponseDto<ContractResponseDto>.Failure("Không tìm thấy booking");
            }

            if (booking.User == null || booking.Car == null)
            {
                return ResponseDto<ContractResponseDto>.Failure("Thông tin booking không đầy đủ");
            }

            // 2. Kiểm tra xem đã có hợp đồng chưa
            var existingContract = await _contractRepo.GetByBookingIdAsync(bookingId);
            if (existingContract != null && !existingContract.IsDeleted)
            {
                return ResponseDto<ContractResponseDto>.Failure("Booking này đã có hợp đồng");
            }

            // 3. Tạo số hợp đồng tự động
            var soHopDong = $"HD-{DateTime.Now:yyyyMMdd}-{bookingId.ToString().Substring(0, 8).ToUpper()}";

            // 4. Tạo entity Contract
            var contract = new Contract
            {
                Id = Guid.NewGuid(),
                SoHopDong = soHopDong,
                BookingId = bookingId,
                UserId = booking.UserId,
                CarId = booking.CarId,
                HoTenBenA = $"{booking.User.FirstName} {booking.User.LastName}",
                BienSoXe = booking.Car.LicensePlate,
                Status = ContractStatus.Pending,
                NgayTao = DateTime.UtcNow,
                NgayHetHan = booking.EndTime, // Hợp đồng hết hạn khi booking kết thúc
                IsDeleted = false
            };

            // 5. Generate file DOCX từ template
            var templatePath = Path.Combine(_env.ContentRootPath, "Templates", "hopdongthuexe.docx");
            if (!File.Exists(templatePath))
            {
                return ResponseDto<ContractResponseDto>.Failure("Template hợp đồng không tồn tại");
            }

            using var document = DocX.Load(templatePath);

            // Thay thế các placeholder trong template
            var ngayKy = DateTime.Now;
            document.ReplaceText("{{so_hop_dong}}", soHopDong);
            document.ReplaceText("{{ngay_ky}}", ngayKy.Day.ToString());
            document.ReplaceText("{{thang_ky}}", ngayKy.Month.ToString());
            document.ReplaceText("{{nam_ky}}", ngayKy.Year.ToString());

            // Thông tin Bên A (Người thuê)
            document.ReplaceText("{{HO_TEN_BEN_A}}", $"{booking.User.FirstName} {booking.User.LastName}");
            document.ReplaceText("{{nam_sinh_ben_a}}", booking.User.DateOfBirth.Year.ToString());
            document.ReplaceText("{{cccd_hoac_ho_chieu_ben_a}}", booking.User.DriverLicenseNumber ?? "N/A");
            document.ReplaceText("{{ho_khau_thuong_tru}}", booking.User.Address ?? "N/A");

            // Thông tin Xe
            document.ReplaceText("{{nhan_hieu}}", booking.Car.Brand);
            document.ReplaceText("{{bien_so}}", booking.Car.LicensePlate);
            document.ReplaceText("{{loai_xe}}", booking.Car.Model);
            document.ReplaceText("{{mau_son}}", booking.Car.Color);
            document.ReplaceText("{{cho_ngoi}}", "N/A"); // Có thể thêm vào Car model nếu cần
            document.ReplaceText("{{xe_dang_ki_han}}", "N/A");

            // GPLX
            document.ReplaceText("{{gplx_hang}}", "B2"); // Có thể lấy từ User nếu có field
            document.ReplaceText("{{gplx_so}}", booking.User.DriverLicenseNumber ?? "N/A");
            document.ReplaceText("{{gplx_han_su_dung}}", booking.User.DriverLicenseExpiry?.ToString("dd/MM/yyyy") ?? "N/A");

            // Thời hạn thuê
            var thoiGianThue = (booking.EndTime ?? DateTime.Now.AddDays(1)) - booking.StartTime;
            var soNgayThue = (int)Math.Ceiling(thoiGianThue.TotalDays);
            document.ReplaceText("{{thoi_han_thue_so}}", soNgayThue.ToString());
            document.ReplaceText("{{thoi_han_thue_chu}}", ChuyenSoThanhChu(soNgayThue));

            // Giá thuê
            var giaThueSo = booking.TotalAmount.ToString("N0", new CultureInfo("vi-VN"));
            document.ReplaceText("{{gia_thue_so}}", giaThueSo);
            document.ReplaceText("{{gia_thue_chu}}", ChuyenSoThanhChu((int)booking.TotalAmount));
            document.ReplaceText("{{phuong_thuc_thanh_toan}}", booking.PaymentStatus ?? "Chuyển khoản");
            document.ReplaceText("{{ngay_thanh_toan}}", booking.StartTime.ToString("dd/MM/yyyy"));

            // 6. Lưu file DOCX
            var storageDir = Path.Combine(_env.ContentRootPath, "Storage");
            Directory.CreateDirectory(storageDir);
            var filePath = Path.Combine(storageDir, $"{contract.Id}.docx");

            using var memoryStream = new MemoryStream();
            document.SaveAs(memoryStream);
            memoryStream.Position = 0;
            await File.WriteAllBytesAsync(filePath, memoryStream.ToArray());

            // 7. Lưu vào database
            await _contractRepo.AddAsync(contract);

            // 8. Trả về response
            var response = new ContractResponseDto
            {
                ContractId = contract.Id,
                SoHopDong = contract.SoHopDong,
                HoTenBenA = contract.HoTenBenA,
                BienSoXe = contract.BienSoXe,
                NgayTao = contract.NgayTao ?? DateTime.UtcNow,
                Status = contract.Status.ToString(),
                FilePath = filePath
            };

            return ResponseDto<ContractResponseDto>.Success(response, "Tạo hợp đồng thành công");
        }
        catch (Exception ex)
        {
            return ResponseDto<ContractResponseDto>.Failure($"Lỗi khi tạo hợp đồng: {ex.Message}");
        }
    }

    /// <summary>
    /// API MỚI: Gửi email với file hợp đồng và link xác nhận
    /// </summary>
    public async Task<ResponseDto<string>> GuiEmailXacNhanKyAsync(Guid contractId)
    {
        try
        {
            // 1. Lấy hợp đồng
            var contract = await _contractRepo.GetByIdAsync(contractId);
            if (contract == null)
            {
                return ResponseDto<string>.Failure("Không tìm thấy hợp đồng");
            }

            if (contract.Status != ContractStatus.Pending)
            {
                return ResponseDto<string>.Failure("Hợp đồng đã được xử lý hoặc không hợp lệ");
            }

            // 2. Lấy thông tin booking để lấy email
            var booking = await _bookingRepo.GetBookingWithDetailsAsync(contract.BookingId);
            if (booking?.User?.Email == null)
            {
                return ResponseDto<string>.Failure("Không tìm thấy email người dùng");
            }

            // 3. Tạo confirmation token
            contract.ConfirmationToken = Guid.NewGuid().ToString("N");
            contract.TokenExpiry = DateTime.UtcNow.AddHours(24);
            await _contractRepo.UpdateAsync(contract);

            // 4. Tạo link xác nhận (sử dụng domain từ config hoặc default)
            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "https://your-frontend.com";
            var confirmationLink = $"{frontendUrl}/xac-nhan-hop-dong?token={contract.ConfirmationToken}";

            // 5. Đường dẫn file DOCX
            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.Id}.docx");
            if (!File.Exists(docxPath))
            {
                return ResponseDto<string>.Failure("File hợp đồng không tồn tại");
            }

            // 6. Gửi email
            await _emailService.SendContractConfirmationEmailAsync(
                booking.User.Email,
                contract.HoTenBenA,
                contract.SoHopDong,
                confirmationLink,
                docxPath
            );

            return ResponseDto<string>.Success("", "Email xác nhận đã được gửi đi.");
        }
        catch (Exception ex)
        {
            return ResponseDto<string>.Failure($"Lỗi khi gửi email: {ex.Message}");
        }
    }

    /// <summary>
    /// API MỚI: Lấy thông tin hợp đồng để hiển thị (từ token)
    /// </summary>
    public async Task<ResponseDto<HopDongXacNhanDto>> LayThongTinHopDongTheoTokenAsync(string token)
    {
        try
        {
            var contract = await _contractRepo.GetByTokenAsync(token);
            if (contract == null)
            {
                return ResponseDto<HopDongXacNhanDto>.Failure("Token không hợp lệ");
            }

            if (contract.Status != ContractStatus.Pending)
            {
                return ResponseDto<HopDongXacNhanDto>.Failure("Hợp đồng đã được xử lý");
            }

            if (contract.TokenExpiry < DateTime.UtcNow)
            {
                return ResponseDto<HopDongXacNhanDto>.Failure("Link đã hết hạn");
            }

            // Đọc file DOCX và chuyển sang HTML
            var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.Id}.docx");
            if (!File.Exists(docxPath))
            {
                return ResponseDto<HopDongXacNhanDto>.Failure("File hợp đồng không tồn tại");
            }

            var docxBytes = await File.ReadAllBytesAsync(docxPath);
            var wmlDoc = new WmlDocument(docxPath, docxBytes);
            var settings = new WmlToHtmlConverterSettings();
            var htmlElement = WmlToHtmlConverter.ConvertToHtml(wmlDoc, settings);
            var htmlString = htmlElement.ToString(System.Xml.Linq.SaveOptions.DisableFormatting);

            var result = new HopDongXacNhanDto(
                contract.SoHopDong,
                contract.HoTenBenA,
                contract.NgayTao,
                htmlString
            );

            return ResponseDto<HopDongXacNhanDto>.Success(result);
        }
        catch (Exception ex)
        {
            return ResponseDto<HopDongXacNhanDto>.Failure($"Lỗi: {ex.Message}");
        }
    }

    /// <summary>
    /// API MỚI: Xác nhận ký hợp đồng
    /// </summary>
    public async Task<ResponseDto<string>> XacNhanKyHopDongAsync(string token)
    {
        try
        {
            var contract = await _contractRepo.GetByTokenAsync(token);
            if (contract == null)
            {
                return ResponseDto<string>.Failure("Token không hợp lệ");
            }

            if (contract.Status == ContractStatus.Signed)
            {
                return ResponseDto<string>.Failure("Hợp đồng đã được ký trước đó");
            }

            if (contract.TokenExpiry < DateTime.UtcNow)
            {
                contract.Status = ContractStatus.Expired;
                await _contractRepo.UpdateAsync(contract);
                return ResponseDto<string>.Failure("Link đã hết hạn");
            }

            // Cập nhật trạng thái
            contract.Status = ContractStatus.Signed;
            contract.NgayKy = DateTime.UtcNow;
            contract.ConfirmationToken = null; // Vô hiệu hóa token
            await _contractRepo.UpdateAsync(contract);

            return ResponseDto<string>.Success("", "Hợp đồng đã được ký thành công");
        }
        catch (Exception ex)
        {
            return ResponseDto<string>.Failure($"Lỗi: {ex.Message}");
        }
    }

    /// <summary>
    /// Xóa mềm hợp đồng
    /// </summary>
    public async Task<ResponseDto<string>> XoaMemHopDongAsync(Guid id)
    {
        try
        {
            var contract = await _contractRepo.GetByIdAsync(id);
            if (contract == null)
            {
                return ResponseDto<string>.Failure("Không tìm thấy hợp đồng");
            }

            contract.IsDeleted = true;
            await _contractRepo.UpdateAsync(contract);

            return ResponseDto<string>.Success("", "Xóa hợp đồng thành công");
        }
        catch (Exception ex)
        {
            return ResponseDto<string>.Failure($"Lỗi: {ex.Message}");
        }
    }

    // Helper method: Chuyển số thành chữ (tiếng Việt)
    private string ChuyenSoThanhChu(int number)
    {
        if (number == 0) return "không";
        
        string[] ones = { "", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín" };
        string[] tens = { "", "", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi" };
        
        if (number < 10) return ones[number];
        if (number < 20) return "mười " + ones[number % 10];
        if (number < 100) return tens[number / 10] + " " + ones[number % 10];
        if (number < 1000) return ones[number / 100] + " trăm " + ChuyenSoThanhChu(number % 100);
        
        return number.ToString(); // Fallback cho số lớn
    }

    #region Legacy Methods (Keep for backward compatibility)

    public async Task<Guid> LuuHopDongVaTaoFileAsync(TaoHopDongDto request)
    {
        var ngayTao = DateTime.UtcNow;
        DateTime? ngayHetHan = null;

        // --- LOGIC TÍNH NGÀY HẾT HẠN NẰM Ở ĐÂY ---
        if (request.DonViThoiHan.ToLower() == "thang")
        {
            ngayHetHan = ngayTao.AddMonths(request.ThoiHanThue);
        }
        else if (request.DonViThoiHan.ToLower() == "ngay")
        {
            ngayHetHan = ngayTao.AddDays(request.ThoiHanThue);
        }

        var contract = new Contract
        {
            Id = Guid.NewGuid(),
            SoHopDong = request.SoHopDong,
            HoTenBenA = request.BenA.HoTen,
            BienSoXe = request.Xe.BienSo,
            NgayTao = DateTime.UtcNow,
            Status = ContractStatus.Pending
        };

        //await _repo.AddAsync(hopDongEntity);

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
        var filePath = Path.Combine(_env.ContentRootPath, "Storage", $"{contract.Id}.docx");
        // Đảm bảo thư mục Storage tồn tại
        Directory.CreateDirectory(Path.GetDirectoryName(filePath));
        await File.WriteAllBytesAsync(filePath, memoryStream.ToArray()); // Lưu file vật lý

        await _contractRepo.AddAsync(contract);
        return contract.Id;
    }

    // API Gửi Email (Legacy)
    public async Task GuiEmailXacNhanAsync(Guid hopDongId, string email)
    {
        // Bước 1: Tìm hợp đồng trong DB
        var hopDong = await _contractRepo.GetByIdAsync(hopDongId); // Cần thêm GetByIdAsync vào Repository
        if (hopDong == null || hopDong.Status != ContractStatus.Pending)
        {
            throw new Exception("Hợp đồng không tồn tại hoặc đã được xử lý.");
        }

        // Bước 2: Tạo token và thời gian hết hạn
        hopDong.ConfirmationToken = Guid.NewGuid().ToString("N");
        hopDong.TokenExpiry = DateTime.UtcNow.AddHours(24); // Token hết hạn sau 24 giờ

        // Bước 3: Cập nhật hợp đồng với token mới
        await _contractRepo.UpdateAsync(hopDong);

        // Bước 4: Tạo link xác nhận
        // Lưu ý: "https://your-frontend.com" là địa chỉ trang frontend của bạn
        var confirmationLink = $"https://your-frontend.com/xac-nhan-hop-dong?token={hopDong.ConfirmationToken}";

        // Bước 5: Gọi EmailService để gửi
        await _emailService.SendConfirmationEmailAsync(email, confirmationLink);
    }

    // API #2: Lấy nội dung để ký (Legacy)
    public async Task<HopDongXacNhanDto> LayHopDongDeXacNhanAsync(string token)
    {
        var hopDong = await _contractRepo.GetByTokenAsync(token);
        if (hopDong == null || hopDong.Status != ContractStatus.Pending || hopDong.TokenExpiry < DateTime.UtcNow)
        {
            throw new Exception("Link không hợp lệ hoặc đã hết hạn.");
        }

        var docxPath = Path.Combine(_env.ContentRootPath, "Storage", $"{hopDong.Id}.docx");
        var docxBytes = await File.ReadAllBytesAsync(docxPath);

        // Chuyển DOCX sang HTML
        var settings = new WmlToHtmlConverterSettings();
        var wmlDoc = new WmlDocument(docxPath, docxBytes);
        var htmlElement = WmlToHtmlConverter.ConvertToHtml(wmlDoc, settings);
        var htmlString = htmlElement.ToString(System.Xml.Linq.SaveOptions.DisableFormatting);

        return new HopDongXacNhanDto(hopDong.SoHopDong, hopDong.HoTenBenA, hopDong.NgayTao, htmlString);
    }

    #endregion
}
