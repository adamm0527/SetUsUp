namespace SetUsUpBE.Infrastructure.ServicesExternal.Email;

public sealed class EmailConfiguration
{
    public string From { get; init; }
        = "dev.setusup@gmail.com";

    public string SmtpServer { get; init; }
        = "smtp.gmail.com";

    public int Port { get; init; }
        = 465;

    public string UserName { get; init; }
        = "dev.setusup@gmail.com";

    public string Password { get; init; }
        = "ikopncobmzjjttmk";
}
