using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.Infrastructure.IdentityExtensions;

public static class IdentityErrors
{
    public static Error Create(IEnumerable<string> errors) =>
        new("User.IdentityErrors",
            "Identity Server produced these errors:\n" + string.Join('\n', errors));
}
