using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IContractService
    {
        /// <summary>
        /// T?o h?p ??ng t? thông tin booking (auto-generate t? user + booking info)
        /// </summary>
        Task<ResponseDto<ContractResponseDto>> TaoHopDongTuBookingAsync(Guid bookingId);
        
        /// <summary>
        /// G?i email v?i file h?p ??ng và link xác nh?n ký
        /// </summary>
        Task<ResponseDto<string>> GuiEmailXacNhanKyAsync(Guid contractId);
        
        /// <summary>
        /// L?y thông tin h?p ??ng ?? hi?n th? trang xác nh?n (t? token)
        /// </summary>
        Task<ResponseDto<HopDongXacNhanDto>> LayThongTinHopDongTheoTokenAsync(string token);
        
        /// <summary>
        /// Xác nh?n ký h?p ??ng (khi user click vào link trong email)
        /// </summary>
        Task<ResponseDto<string>> XacNhanKyHopDongAsync(string token);
        
        /// <summary>
        /// Xóa m?m h?p ??ng
        /// </summary>
        Task<ResponseDto<string>> XoaMemHopDongAsync(Guid id);
        
        // Legacy methods (keep for backward compatibility)
        Task<Guid> LuuHopDongVaTaoFileAsync(TaoHopDongDto request);
        Task GuiEmailXacNhanAsync(Guid hopDongId, string email);
        Task<HopDongXacNhanDto> LayHopDongDeXacNhanAsync(string token);
    }
}
