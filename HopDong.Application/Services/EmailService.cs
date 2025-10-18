using HopDong.Application.Services.IServices;
using MailKit.Net.Smtp; // <-- Add this using directive for MailKit SmtpClient
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using System.Net.Mail;

namespace HopDong.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendConfirmationEmailAsync(string toEmail, string confirmationLink)
        {
            var emailSettings = _config.GetSection("EmailSettings");

            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(emailSettings["SenderName"], emailSettings["SenderEmail"]));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = "Xác nhận Hợp đồng Thuê xe của bạn";

            var body = new BodyBuilder
            {
                HtmlBody = $@"
                <p>Chào bạn,</p>
                <p>Vui lòng nhấp vào liên kết dưới đây để xem lại và ký hợp đồng thuê xe của bạn.</p>
                <p><a href='{confirmationLink}'>Xem và Ký Hợp đồng</a></p>
                <p>Liên kết này sẽ hết hạn trong vòng 24 giờ.</p>
                <p>Trân trọng,<br/>{emailSettings["SenderName"]}</p>"
            };
            email.Body = body.ToMessageBody();

            // Fix for CS8604: Ensure Port is not null before parsing
            var portString = emailSettings["Port"];
            if (string.IsNullOrWhiteSpace(portString))
                throw new InvalidOperationException("EmailSettings:Port is not configured.");

            using var smtp = new MailKit.Net.Smtp.SmtpClient(); // Use MailKit SmtpClient
            var password = Environment.GetEnvironmentVariable("PASSWORD") ?? emailSettings["Password"];
            await smtp.ConnectAsync(emailSettings["SmtpServer"], int.Parse(portString), SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(emailSettings["Username"], password);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
