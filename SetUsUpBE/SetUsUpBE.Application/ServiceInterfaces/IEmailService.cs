using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.Application.ServiceInterfaces;

public interface IEmailService
{
    Task<Result<bool>> SendEmailAsync(IEnumerable<string> to, string subject, string content);
}
