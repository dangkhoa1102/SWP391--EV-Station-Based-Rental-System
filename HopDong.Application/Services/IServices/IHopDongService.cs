using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HopDong.Application.Services.IServices
{
    public interface IHopDongService
    {
        Task<Guid> LuuHopDongVaTaoFileAsync(TaoHopDongDto request);
        Task GuiEmailXacNhanAsync(Guid hopDongId, string email);
        Task<HopDongXacNhanDto> LayHopDongDeXacNhanAsync(string token);
        Task XacNhanKyHopDongAsync(string token);
        Task XoaMemHopDongAsync(Guid id);
    }
}
