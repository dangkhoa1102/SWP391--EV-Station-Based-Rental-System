namespace Monolithic.Services.Interfaces
{
    public interface IContractEmailService
    {
        /// <summary>
        /// G?i email xác nh?n h?p ??ng
        /// </summary>
        Task SendConfirmationEmailAsync(string toEmail, string confirmationLink, string downloadLink);
    }
}
