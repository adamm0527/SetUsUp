using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.Domain.Entities;

public sealed class Group : AggregateRoot
{
    private readonly bool isUserCreated;
    private string name; // non-empty


    private Group(bool isUserCreated, string name, Guid? id = null)
    {
        this.isUserCreated = isUserCreated;
        this.name = name;
        if (id is not null) // when creating group from an already persisted group (it already has an id)
            base.Id = (Guid)id;
    }

    public static Result<Group> Create(bool isUserCreated, string name, Guid? id = null)
    {
        // name cannot be empty
        string trimmedName = TrimName_(name);
        var nameResult = CheckStringNotNullOrEmpty_<Group>(trimmedName, Error.GroupNameEmpty);
        if (nameResult.HasFailed)
            return nameResult;

        Group resultGroup = new Group(isUserCreated, trimmedName, id);
        return Result<Group>.Success(resultGroup);
    }

    public bool IsUserCreated => isUserCreated;

    public string GetName() => name;
    public Result<string> SetName(string name)
    {
        // new name cannot be empty
        string trimmedName = TrimName_(name);
        var nameResult = CheckStringNotNullOrEmpty_<string>(trimmedName, Error.GroupNameEmpty);
        if (nameResult.HasFailed)
            return nameResult;

        this.name = trimmedName;
        return Result<string>.Success(trimmedName);
    }


    // Validation checks
    // The Create factory and the Setters both use these as invariants
    // (validation logic should only be modified here)

    private static Result<T> CheckStringNotNullOrEmpty_<T>(string str, Error raisedError)
    {
        if (string.IsNullOrEmpty(str))
            return Result<T>.Failure(raisedError);

        return Result<T>.Success();
    }

    private static string TrimName_(string name)
    {
        if (name is null)
            return string.Empty;
        else
            return name.Trim();
    }
}
