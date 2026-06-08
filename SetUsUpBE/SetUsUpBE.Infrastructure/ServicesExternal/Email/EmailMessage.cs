using MimeKit;

namespace SetUsUpBE.Infrastructure.ServicesExternal.Email;

public sealed class EmailMessage
{
    public List<MailboxAddress> To { get; set; }
    public string Subject { get; set; }
    public string Content { get; set; }

    public EmailMessage(IEnumerable<string> to, string subject, string content)
    {
        To = [.. to.Select(x => new MailboxAddress("email", x))];
        Subject = subject;
        Content = content;
    }
}
