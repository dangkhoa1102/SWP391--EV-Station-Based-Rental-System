using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Monolithic.Models;
using Monolithic.Services.Interfaces;

namespace Monolithic.Services.Implementation
{
    public class ContractEmailService : IContractEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<ContractEmailService> _logger;

        public ContractEmailService(IConfiguration config, ILogger<ContractEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// G?i email xác nh?n h?p ??ng v?i link ký và link download
        /// </summary>
        public async Task SendConfirmationEmailAsync(string toEmail, string confirmationLink, string downloadLink)
        {
            try
            {
                var emailSettings = _config.GetSection("EmailSettings");
                if (emailSettings == null || !emailSettings.GetChildren().Any())
                {
                    _logger.LogError("EmailSettings not configured in appsettings.json");
                    throw new InvalidOperationException("EmailSettings is not configured");
                }

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(
                    emailSettings["SenderName"] ?? "Công ty cho thuê xe FEC",
                    emailSettings["SenderEmail"] ?? "noreply@example.com"
                ));
                email.To.Add(MailboxAddress.Parse(toEmail));
                email.Subject = "Xác nh?n H?p ??ng Thuê xe c?a b?n";

                var senderName = emailSettings["SenderName"] ?? "Công ty cho thuê xe FEC";

                //var body = new BodyBuilder
                //{
                //    HtmlBody = $@"
                //    <html>
                //        <head>
                //            <meta charset=""UTF-8"">
                //        </head>
                //        <body>
                //            <p>Chào b?n,</p>
                //            <p>Vui lòng nh?p vào liên k?t d??i ?ây ?? xem l?i và ký h?p ??ng thuê xe c?a b?n.</p>
                //            <p><a href='{confirmationLink}' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Xem và Ký H?p ??ng</a></p>
                //            <p>B?n c?ng có th? t?i xu?ng file h?p ??ng Word (.docx) ?? xem tr??c:</p>
                //            <p><a href='{downloadLink}' style='background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>T?i xu?ng H?p ??ng (DOCX)</a></p>
                //            <p>Liên k?t này s? h?t h?n trong vòng 24 gi?.</p>
                //            <hr />
                //            <p>Trân tr?ng,<br/><strong>{senderName}</strong></p>
                //        </body>
                //    </html>"
                //};

                var body = new BodyBuilder
                {
                    HtmlBody = $@"
                    <p>Chào b?n,</p>
                    <p>Vui lòng nh?p vào liên k?t d??i ?ây ?? xem l?i và ký h?p ??ng thuê xe c?a b?n.</p>
                    <p><a href='{confirmationLink}' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Xem và Ký H?p ??ng</a></p>
                    <p>B?n c?ng có th? t?i xu?ng file h?p ??ng Word (.docx) ?? xem tr??c:</p>
                    <p><a href='{downloadLink}' style='background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>T?i xu?ng H?p ??ng (DOCX)</a></p>
                    <p>Liên k?t này s? h?t h?n trong vòng 24 gi?.</p>
                    <hr />
                    <p>Trân tr?ng,<br/><strong>{senderName}</strong></p>"
                };

                email.Body = body.ToMessageBody();

                var portString = emailSettings["Port"];
                if (string.IsNullOrWhiteSpace(portString))
                {
                    throw new InvalidOperationException("EmailSettings:Port is not configured");
                }

                var smtpServer = emailSettings["SmtpServer"];
                var username = emailSettings["Username"];
                var password = Environment.GetEnvironmentVariable("PASSWORD") ?? emailSettings["Password"];

                if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                {
                    throw new InvalidOperationException("SMTP configuration is incomplete");
                }

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(smtpServer, int.Parse(portString), SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(username, password);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                _logger.LogInformation("Confirmation email sent successfully to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending confirmation email to {Email}", toEmail);
                throw;
            }
        }
    }
}
