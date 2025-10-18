namespace HopDong.Application.Services.IServices;

public interface IHopDongFileService
{
    Task<MemoryStream> TaoHopDongFileAsync(TaoHopDongDto request);
}
