namespace SetUsUpBE.Domain.Primitives;

public abstract class ValueObject : IEquatable<ValueObject>
{
    public abstract object GetAtomicValue();

    public static bool operator==(ValueObject? left, ValueObject? right)
    {
        return (left is not null && left.Equals(right));
    }

    public static bool operator!=(ValueObject? left, ValueObject? right)
    {
        return !(left == right);
    }

    public override int GetHashCode()
    {
        return this.GetAtomicValue().GetHashCode() * 79;
    }

    public override bool Equals(object? obj)
    {
        if (obj is null)
            return false;

        if (obj.GetType() != GetType())
            return false;

        if (obj is not ValueObject other)
            return false;

        return this.AtomicValueEquals_(other);
    }

    public bool Equals(ValueObject? other)
    {
        if (other is null)
            return false;

        if (other.GetType() != GetType())
            return false;

        return this.AtomicValueEquals_(other);
    }

    private bool AtomicValueEquals_(ValueObject other)
    {
        return this.GetAtomicValue().Equals(other.GetAtomicValue());
    }
}
