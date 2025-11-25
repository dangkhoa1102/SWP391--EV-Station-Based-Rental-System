using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Monolithic.Services.Interfaces;

namespace Monolithic.Services.Implementation
{
    public class EmailServiceImpl : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailServiceImpl> _logger;

        public EmailServiceImpl(IConfiguration configuration, ILogger<EmailServiceImpl> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
        {
            try
            {
                var emailSettings = _configuration.GetSection("EmailSettings");
                if (emailSettings == null || !emailSettings.GetChildren().Any())
                {
                    _logger.LogError("EmailSettings not configured in appsettings.json or environment variables");
                    throw new InvalidOperationException("EmailSettings is not configured");
                }

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(
                    emailSettings["SenderName"] ?? "EV Rental System",
                    emailSettings["SenderEmail"] ?? "noreply@example.com"
                ));
                email.To.Add(MailboxAddress.Parse(toEmail));
                email.Subject = subject;

                var body = new BodyBuilder
                {
                    HtmlBody = htmlMessage
                };
                email.Body = body.ToMessageBody();

                var smtpServer = emailSettings["SmtpServer"];
                var portString = emailSettings["Port"];
                var username = emailSettings["Username"];
                var password = Environment.GetEnvironmentVariable("PASSWORD") ?? emailSettings["Password"];

                if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(username) ||
                    string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(portString))
                {
                    _logger.LogError("SMTP configuration is incomplete: Server={Server}, Username={Username}, Port={Port}", smtpServer, username, portString);
                    throw new InvalidOperationException("SMTP configuration is incomplete");
                }

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(smtpServer, int.Parse(portString), SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(username, password);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", toEmail);
                throw; // Let caller handle or log as needed
            }
        }
    }
}
