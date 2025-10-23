using MailKit.Security;
using MimeKit;
using Monolithic.Services.Interfaces;

namespace Monolithic.Services.Implementation;

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
        await smtp.ConnectAsync(emailSettings["SmtpServer"], int.Parse(portString), SecureSocketOptions.StartTls);
        var password = Environment.GetEnvironmentVariable("PASSWORD") ?? emailSettings["Password"];
        await smtp.AuthenticateAsync(emailSettings["Username"], password);
        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }

    public async Task SendContractConfirmationEmailAsync(string toEmail, string tenNguoiKy, string soHopDong, string confirmationLink, string docxFilePath)
    {
        var emailSettings = _config.GetSection("EmailSettings");

        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(emailSettings["SenderName"], emailSettings["SenderEmail"]));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = $"Xác nhận Ký Hợp đồng Thuê xe #{soHopDong}";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #2c3e50;'>Xác nhận Ký Hợp đồng Thuê xe</h2>
                    <p>Kính gửi <strong>{tenNguoiKy}</strong>,</p>
                    <p>Hợp đồng thuê xe số <strong>{soHopDong}</strong> của bạn đã được tạo thành công.</p>
                    <p>Vui lòng:</p>
                    <ol>
                        <li>Xem lại nội dung hợp đồng trong file đính kèm</li>
                        <li>Nhấp vào nút bên dưới để xác nhận ký hợp đồng</li>
                    </ol>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{confirmationLink}' 
                           style='background-color: #3498db; 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;
                                  font-weight: bold;'>
                            ✍️ XÁC NHẬN KÝ HỢP ĐỒNG
                        </a>
                    </div>
                    
                    <p style='color: #e74c3c; font-size: 0.9em;'>
                        ⚠️ Link xác nhận này sẽ hết hạn sau <strong>24 giờ</strong>
                    </p>
                    
                    <hr style='border: 1px solid #ecf0f1; margin: 20px 0;'/>
                    
                    <p style='color: #7f8c8d; font-size: 0.85em;'>
                        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.<br/>
                        Trân trọng,<br/>
                        <strong>{emailSettings["SenderName"]}</strong>
                    </p>
                </div>"
        };

        // Đính kèm file DOCX
        if (File.Exists(docxFilePath))
        {
            bodyBuilder.Attachments.Add(docxFilePath);
        }

        email.Body = bodyBuilder.ToMessageBody();

        var portString = emailSettings["Port"];
        if (string.IsNullOrWhiteSpace(portString))
            throw new InvalidOperationException("EmailSettings:Port is not configured.");

        using var smtp = new MailKit.Net.Smtp.SmtpClient();
        await smtp.ConnectAsync(emailSettings["SmtpServer"], int.Parse(portString), SecureSocketOptions.StartTls);
        var password = Environment.GetEnvironmentVariable("PASSWORD") ?? emailSettings["Password"];
        await smtp.AuthenticateAsync(emailSettings["Username"], password);
        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }
}
