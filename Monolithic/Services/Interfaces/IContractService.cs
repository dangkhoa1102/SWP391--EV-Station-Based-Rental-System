using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IContractService
    {
        Task<ResponseDto<ContractDto>> CreateContractAsync(CreateContractDto request);
        Task<ResponseDto<ContractDto>> FillContractAsync(Monolithic.DTOs.Contract.FillContractFieldsDto request, Guid callerUserId, string callerRole);
        Task<ResponseDto<string>> RequestConfirmationAsync(Guid contractId, string email);
        Task<ResponseDto<ContractDto>> ConfirmContractAsync(Guid contractId, string token, string requesterIp, string userAgent);
        Task<ResponseDto<ContractDto>> GetContractByBookingIdAsync(Guid bookingId);
        Task<ResponseDto<List<ContractDto>>> GetContractsByRenterAsync(Guid renterId);

        // --- HopDong Specific Methods ---
        /// <summary>
        /// L?u h?p ??ng thu� xe v� t?o file t? template
        /// </summary>
        Task<Guid> LuuHopDongVaTaoFileAsync(/*TaoHopDongDto request, */Guid bookingId, Guid renterId);

        /// <summary>
        /// G?i email x�c nh?n h?p ??ng
        /// </summary>
        Task GuiEmailXacNhanAsync(Guid contractId, string email);

        /// <summary>
        /// L?y h?p ??ng ?? x�c nh?n (chuy?n sang HTML)
        /// </summary>
        Task<HopDongXacNhanDto> LayHopDongDeXacNhanAsync(string token);

        /// <summary>
        /// X�c nh?n v� k� h?p ??ng
        /// </summary>
        Task XacNhanKyHopDongAsync(string token);

        /// <summary>
        /// X�a m?m h?p ??ng
        /// </summary>
        Task XoaMemHopDongAsync(Guid id);

        /// <summary>
        /// L?y h?p ??ng theo token x�c nh?n
        /// </summary>
        Task<ContractDto> GetContractByTokenAsync(string token);

        /// <summary>
        /// L?y h?p ??ng ?� k� theo contractId (?? xem l?i)
        /// </summary>
        Task<HopDongXacNhanDto> LayHopDongDaKyAsync(Guid contractId);

        /// <summary>
        /// Download file h?p ??ng DOCX
        /// </summary>
        Task<byte[]> DownloadHopDongFileAsync(Guid contractId);

        /// <summary>
        /// Download file h?p ??ng b?ng token (cho email link)
        /// </summary>
        Task<(byte[] FileBytes, string FileName)> DownloadHopDongFileByTokenAsync(string token);

        /// <summary>
        /// Download file h?p ??ng theo ContractId v?i ki?m tra quy?n truy c?p
        /// </summary>
        Task<(byte[] FileBytes, string FileName)> DownloadHopDongFileByContractIdAsync(Guid contractId, Guid? currentUserId, string? userRole);

        /// <summary>
        /// Download hợp đồng mới nhất của user theo RenterId
        /// </summary>
        Task<(byte[] FileBytes, string FileName)> DownloadLatestContractByUserIdAsync(Guid userId, Guid? currentUserId, string? userRole);

        /// <summary>
        /// Download hợp đồng mới nhất của user hiện tại (dựa trên token login)
        /// </summary>
        Task<(byte[] FileBytes, string FileName)> DownloadMyLatestContractAsync(Guid currentUserId);
    }
}
