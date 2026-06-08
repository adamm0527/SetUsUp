using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.WebAPI.Primitives;

public sealed record Response(string status, string? message = null)
{
    // Construction from a Domain Error
    public Response(Error error) : this(error.Code, error.Description)
    {
    }
}
