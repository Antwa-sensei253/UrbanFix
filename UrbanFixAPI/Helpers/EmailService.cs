using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace UrbanFixAPI.Helpers;

public class EmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendOtpAsync(string toEmail, string toName, string otpCode)
    {
        var emailSection = _config.GetSection("Email");
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(emailSection["FromName"], emailSection["Username"]));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "UrbanFix — Your OTP Code";

        message.Body = new TextPart("plain")
        {
            Text = $"Hello {toName}, your UrbanFix verification code is: {otpCode}. This code expires in 10 minutes. If you did not request this, ignore this email."
        };

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(emailSection["Host"], int.Parse(emailSection["Port"]!), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(emailSection["Username"], emailSection["Password"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            // Fallback for local development or invalid SMTP credentials
            Console.WriteLine($"\n[MOCK EMAIL] To: {toEmail}\n[MOCK EMAIL] OTP: {otpCode}\n");
        }
    }

    public async Task SendExecutiveSummaryAsync(string toEmail, string toName, string summaryBody)
    {
        var emailSection = _config.GetSection("Email");
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(emailSection["FromName"], emailSection["Username"]));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "UrbanFix — Daily Executive Summary";

        message.Body = new TextPart("plain")
        {
            Text = summaryBody
        };

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(emailSection["Host"], int.Parse(emailSection["Port"]!), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(emailSection["Username"], emailSection["Password"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch
        {
            Console.WriteLine($"\n[MOCK EMAIL] To: {toEmail}\n[MOCK EMAIL] Daily Executive Summary:\n{summaryBody}\n");
        }
    }
}

