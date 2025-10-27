using Monolithic.DTOs.Contract;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using Xceed.Words.NET;

namespace Monolithic.Services.Implementation
{
    /// <summary>
    /// Service ?? t?o file Word h?p ??ng t? template và qu?n lý h?p ??ng
    /// </summary>
    public class ContractFileService : IContractFileService
    {
        private readonly IHostEnvironment _env;
        private readonly IContractRepository _contractRepository;
        private readonly IBookingRepository _bookingRepository;

        public ContractFileService(
            IHostEnvironment env, 
            IContractRepository contractRepository,
            IBookingRepository bookingRepository)
        {
            _env = env;
            _contractRepository = contractRepository;
            _bookingRepository = bookingRepository;
        }

        /// <summary>
        /// T?o file Word h?p ??ng t? template v?i d? li?u ??ng
        /// </summary>
        public async Task<MemoryStream> TaoHopDongFileAsync(TaoHopDongDto request)
        {
            try
            {
                // B??c 1: T?o file Word t? template
                var templatePath = Path.Combine(_env.ContentRootPath, "Templates", "hopdongthuexe.docx");
                
                if (!File.Exists(templatePath))
                {
                    throw new FileNotFoundException($"Template file not found at: {templatePath}");
                }

                using var document = DocX.Load(templatePath);

                // B??c 2: Thay th? các placeholder
                // Thông tin h?p ??ng
                document.ReplaceText("{{so_hop_dong}}", request.SoHopDong);
                document.ReplaceText("{{ngay_ky}}", request.NgayKy);
                document.ReplaceText("{{thang_ky}}", request.ThangKy);
                document.ReplaceText("{{nam_ky}}", request.NamKy);

                // Thông tin bên A (ng??i thuê)
                document.ReplaceText("{{HO_TEN_BEN_A}}", request.BenA.HoTen);
                document.ReplaceText("{{nam_sinh_ben_a}}", request.BenA.NamSinh);
                document.ReplaceText("{{cccd_hoac_ho_chieu_ben_a}}", request.BenA.CccdHoacHoChieu);
                document.ReplaceText("{{ho_khau_thuong_tru}}", request.BenA.HoKhauThuongTru);

                // Thông tin xe
                document.ReplaceText("{{nhan_hieu}}", request.Xe.NhanHieu);
                document.ReplaceText("{{bien_so}}", request.Xe.BienSo);
                document.ReplaceText("{{loai_xe}}", request.Xe.LoaiXe);
                document.ReplaceText("{{mau_son}}", request.Xe.MauSon);
                document.ReplaceText("{{cho_ngoi}}", request.Xe.ChoNgoi);
                document.ReplaceText("{{xe_dang_ki_han}}", request.Xe.XeDangKiHan);

                // Thông tin gi?y phép lái xe
                document.ReplaceText("{{gplx_hang}}", request.GPLX.Hang);
                document.ReplaceText("{{gplx_so}}", request.GPLX.So);
                document.ReplaceText("{{gplx_han_su_dung}}", request.GPLX.HanSuDung);

                // Thông tin th?i h?n thuê
                document.ReplaceText("{{thoi_han_thue_so}}", request.ThoiHanThueSo);
                document.ReplaceText("{{thoi_han_thue_chu}}", request.ThoiHanThueChu);

                // Thông tin giá thuê
                document.ReplaceText("{{gia_thue_so}}", request.GiaThue.GiaThueSo);
                document.ReplaceText("{{gia_thue_chu}}", request.GiaThue.GiaThueChu);
                document.ReplaceText("{{phuong_thuc_thanh_toan}}", request.GiaThue.PhuongThucThanhToan);
                document.ReplaceText("{{ngay_thanh_toan}}", request.GiaThue.NgayThanhToan);

                // B??c 3: L?u file vào MemoryStream
                var memoryStream = new MemoryStream();
                document.SaveAs(memoryStream);
                memoryStream.Position = 0;

                return memoryStream;
            }
            catch (Exception ex)
            {
                throw new Exception($"L?i khi t?o file h?p ??ng: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// T?o file Word h?p ??ng và l?u thông tin vào database v?i bookingId
        /// </summary>
        public async Task<MemoryStream> TaoHopDongFileWithBookingAsync(Guid bookingId, TaoHopDongDto request)
        {
            try
            {
                // B??c 1: Ki?m tra booking có t?n t?i không
                var booking = await _bookingRepository.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    throw new ArgumentException($"Booking with ID {bookingId} not found");
                }

                // B??c 2: T?o file Word
                var fileStream = await TaoHopDongFileAsync(request);

                // B??c 3: (Tùy ch?n) L?u thông tin vào database
                // Có th? m? r?ng sau ?? l?u chi ti?t h?p ??ng

                return fileStream;
            }
            catch (Exception ex)
            {
                throw new Exception($"L?i khi t?o file h?p ??ng v?i booking: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// L?y thông tin h?p ??ng theo bookingId
        /// </summary>
        public async Task<ContractDto> GetContractByBookingIdAsync(Guid bookingId)
        {
            try
            {
                var contract = await _contractRepository.GetByBookingIdAsync(bookingId);
                if (contract == null)
                {
                    throw new KeyNotFoundException($"Contract not found for booking {bookingId}");
                }

                return new ContractDto
                {
                    ContractId = contract.ContractId,
                    BookingId = contract.BookingId,
                    RenterId = contract.RenterId,
                    ContractContent = contract.ContractContent,
                    SignatureType = contract.SignatureType,
                    IsConfirmed = contract.IsConfirmed,
                    CreatedAt = contract.CreatedAt
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"L?i khi l?y h?p ??ng: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// C?p nh?t h?p ??ng theo bookingId
        /// </summary>
        public async Task<bool> UpdateContractByBookingIdAsync(Guid bookingId, TaoHopDongDto request)
        {
            try
            {
                var contract = await _contractRepository.GetByBookingIdAsync(bookingId);
                if (contract == null)
                {
                    throw new KeyNotFoundException($"Contract not found for booking {bookingId}");
                }

                // C?p nh?t thông tin h?p ??ng
                contract.ContractContent = $"H?p ??ng s?: {request.SoHopDong}, Ký ngày: {request.NgayKy}/{request.ThangKy}/{request.NamKy}";
                contract.UpdatedAt = DateTime.UtcNow;

                await _contractRepository.UpdateAsync(contract);
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"L?i khi c?p nh?t h?p ??ng: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Xóa h?p ??ng theo bookingId (soft delete)
        /// </summary>
        public async Task<bool> DeleteContractByBookingIdAsync(Guid bookingId)
        {
            try
            {
                var contract = await _contractRepository.GetByBookingIdAsync(bookingId);
                if (contract == null)
                {
                    throw new KeyNotFoundException($"Contract not found for booking {bookingId}");
                }

                await _contractRepository.DeleteAsync(contract);
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception($"L?i khi xóa h?p ??ng: {ex.Message}", ex);
            }
        }
    }
}
