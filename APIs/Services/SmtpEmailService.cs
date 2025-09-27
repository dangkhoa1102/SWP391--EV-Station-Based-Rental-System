using APIs.Repositories;
using System.Net.Mail;

namespace APIs.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public SmtpEmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            //var host = _config["Smtp:Host"];
            //var port = int.Parse(_config["Smtp:Port"] ?? "587");
            //var user = _config["Smtp:User"];
            //var pass = _config["Smtp:Pass"];
            //var from = _config["Smtp:From"] ?? user;
            var host = Environment.GetEnvironmentVariable("SMTP_HOST");
            var port = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
            var user = Environment.GetEnvironmentVariable("SMTP_USER");
            var pass = Environment.GetEnvironmentVariable("SMTP_PASS");
            var from = Environment.GetEnvironmentVariable("SMTP_FROM") ?? user;

            using var msg = new MailMessage();
            msg.From = new MailAddress(from);
            msg.To.Add(new MailAddress(to));
            msg.Subject = subject;
            msg.Body = body;
            msg.IsBodyHtml = true;

            using var client = new SmtpClient(host, port)
            {
                Credentials = new System.Net.NetworkCredential(user, pass),
                EnableSsl = true
            };

            // use Task.Run to avoid blocking
            await Task.Run(() => client.Send(msg));
        }
    }
}
