using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IContractService
    {
        /// <summary>
        /// T?o h?p ??ng t? th�ng tin booking (auto-generate t? user + booking info)
        /// </summary>
        Task<ResponseDto<ContractResponseDto>> TaoHopDongTuBookingAsync(Guid bookingId);
        
        /// <summary>
        /// G?i email v?i file h?p ??ng v� link x�c nh?n k�
        /// </summary>
        Task<ResponseDto<string>> GuiEmailXacNhanKyAsync(Guid contractId);
        
        /// <summary>
        /// L?y th�ng tin h?p ??ng ?? hi?n th? trang x�c nh?n (t? token)
        /// </summary>
        Task<ResponseDto<HopDongXacNhanDto>> LayThongTinHopDongTheoTokenAsync(string token);
        
        /// <summary>
        /// X�c nh?n k� h?p ??ng (khi user click v�o link trong email)
        /// </summary>
        Task<ResponseDto<string>> XacNhanKyHopDongAsync(string token);
        
        /// <summary>
        /// X�a m?m h?p ??ng
        /// </summary>
        Task<ResponseDto<string>> XoaMemHopDongAsync(Guid id);
        
        // Legacy methods (keep for backward compatibility)
        Task<Guid> LuuHopDongVaTaoFileAsync(TaoHopDongDto request);
        Task GuiEmailXacNhanAsync(Guid hopDongId, string email);
        Task<HopDongXacNhanDto> LayHopDongDeXacNhanAsync(string token);
    }
}
