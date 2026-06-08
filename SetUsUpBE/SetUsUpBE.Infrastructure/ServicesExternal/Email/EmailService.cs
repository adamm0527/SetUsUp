using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Application.ServiceInterfaces;
using MimeKit;
using MimeKit.Text;
using MailKit.Net.Smtp;

namespace SetUsUpBE.Infrastructure.ServicesExternal.Email;

public sealed class EmailService : IEmailService
{
    private readonly EmailConfiguration emailConfig;
    public EmailService(EmailConfiguration emailConfig) => this.emailConfig = emailConfig;

    public async Task<Result<bool>> SendEmailAsync(IEnumerable<string> to, string subject, string content)
    {
        var mimeMessage = new MimeMessage()
        {
            Subject = subject,
            Body = new TextPart(TextFormat.Text) { Text = content },
        };
        
        mimeMessage.From.Add(new MailboxAddress("SetUsUp noreply", emailConfig.From));
        
        foreach (var address in to)
        {
            mimeMessage.To.Add(new MailboxAddress("SetUsUp noreply", address));
        }

        using (var client = new SmtpClient())
        {
            try
            {
                await client.ConnectAsync(emailConfig.SmtpServer, emailConfig.Port, true);
                client.AuthenticationMechanisms.Remove("XOAUTH2");
                await client.AuthenticateAsync(emailConfig.UserName, emailConfig.Password);
                await client.SendAsync(mimeMessage);
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure(new Error("SmtpClient.Exception", ex.Message));
            }
            finally
            {
                client.Disconnect(true);
                client.Dispose();
            }
            return Result<bool>.Success(true);
        }
    }
}
