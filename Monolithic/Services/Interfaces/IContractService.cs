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
    }
}
