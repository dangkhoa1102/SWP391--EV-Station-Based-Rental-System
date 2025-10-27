using Monolithic.DTOs.Contract;

namespace Monolithic.Services.Interfaces
{
    /// <summary>
    /// Service ?? t?o file Word h?p ??ng t? template
    /// </summary>
    public interface IContractFileService
    {
        /// <summary>
        /// T?o file Word h?p ??ng t? template v?i d? li?u ??ng
        /// </summary>
        Task<MemoryStream> TaoHopDongFileAsync(TaoHopDongDto request);

        /// <summary>
        /// T?o file Word h?p ??ng và l?u thông tin vào database v?i bookingId
        /// </summary>
        Task<MemoryStream> TaoHopDongFileWithBookingAsync(Guid bookingId, TaoHopDongDto request);

        /// <summary>
        /// L?y thông tin h?p ??ng theo bookingId
        /// </summary>
        Task<ContractDto> GetContractByBookingIdAsync(Guid bookingId);

        /// <summary>
        /// C?p nh?t h?p ??ng theo bookingId
        /// </summary>
        Task<bool> UpdateContractByBookingIdAsync(Guid bookingId, TaoHopDongDto request);

        /// <summary>
        /// Xóa h?p ??ng theo bookingId
        /// </summary>
        Task<bool> DeleteContractByBookingIdAsync(Guid bookingId);
    }
}
