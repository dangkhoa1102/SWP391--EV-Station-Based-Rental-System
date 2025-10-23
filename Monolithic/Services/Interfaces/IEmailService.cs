namespace Monolithic.Services.Interfaces
{
    public interface IEmailService
    {
        /// <summary>
        /// Gửi email xác nhận hợp đồng với link (legacy method)
        /// </summary>
        Task SendConfirmationEmailAsync(string toEmail, string confirmationLink);
        
        /// <summary>
        /// Gửi email xác nhận hợp đồng với file DOCX đính kèm
        /// </summary>
        Task SendContractConfirmationEmailAsync(string toEmail, string tenNguoiKy, string soHopDong, string confirmationLink, string docxFilePath);
    }
}
