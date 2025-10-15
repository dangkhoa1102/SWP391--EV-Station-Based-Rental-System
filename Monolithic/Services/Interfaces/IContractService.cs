using Monolithic.DTOs.Contract;
using Monolithic.DTOs.Common;

namespace Monolithic.Services.Interfaces
{
    public interface IContractService
    {
        Task<Guid> LuuHopDongVaTaoFileAsync(TaoHopDongDto request);
        Task GuiEmailXacNhanAsync(Guid hopDongId, string email);
        Task<HopDongXacNhanDto> LayHopDongDeXacNhanAsync(string token);
        Task XacNhanKyHopDongAsync(string token);
        Task XoaMemHopDongAsync(Guid id);
    }
}
