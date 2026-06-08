namespace SetUsUpBE.Domain.Primitives;

public sealed class Result<T> : IEquatable<Result<T>>
{
    public Error Error { get; }
    public T? Value { get; }

    public bool HasSucceeded => (Error == Error.None);
    public bool HasFailed => (Error != Error.None);

    private Result(Error error)
    {
        Error = error;
        Value = default;
    }

    private Result(T? value)
    {
        Error = Error.None;
        Value = value;
    }

    public static Result<T> Failure(Error error) => new(error);
    public static Result<T> Success() => new(Error.None);
    public static Result<T> Success(T? value) => new(value);

    public override int GetHashCode()
    {
        if (HasSucceeded && Value is not null)
            return Value.GetHashCode();
        else
            return Error.GetHashCode();
    }

    public override bool Equals(object? obj)
    {
        return obj is Result<T> other
             && this.IsEqualTo_(other);
    }

    public bool Equals(Result<T>? other)
    {
        return other is not null
             && this.IsEqualTo_(other);
    }

    private bool IsEqualTo_(Result<T> other)
    {
        if (HasSucceeded && Value is not null)
            return Value.Equals(other.Value);
        else
            return Error.Equals(other.Error);
    }
}
