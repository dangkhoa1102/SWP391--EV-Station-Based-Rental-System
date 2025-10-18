namespace HopDong.Application.Services.IServices;

public interface IEmailService
{
    Task SendConfirmationEmailAsync(string toEmail, string confirmationLink);
}
