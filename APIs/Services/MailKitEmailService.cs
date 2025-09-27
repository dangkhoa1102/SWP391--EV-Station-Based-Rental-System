using APIs.Repositories;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace APIs.Services
{
    public class MailKitEmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public MailKitEmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string to, string subject, string msg)
        {
            var email = new MimeMessage();     
            email.Sender = MailboxAddress.Parse(_config["SMTP_FROM"] ?? Environment.GetEnvironmentVariable("SMTP_FROM"));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = msg };
            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_config["SMTP_HOST"] ?? Environment.GetEnvironmentVariable("SMTP_HOST"), int.Parse(_config["SMTP_PORT"] ?? Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587"), SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(_config["SMTP_USER"] ?? Environment.GetEnvironmentVariable("SMTP_USER"), _config["SMTP_PASS"] ?? Environment.GetEnvironmentVariable("SMTP_PASS"));
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
