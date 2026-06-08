namespace SetUsUpBE.Domain.Primitives;

public abstract class Entity : IEquatable<Entity>
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public static bool operator==(Entity? left, Entity? right)
    {
        return (left is not null && left.Equals(right));
    }

    public static bool operator!=(Entity? left, Entity? right)
    {
        return !(left == right);
    }

    public override int GetHashCode()
    {
        return this.Id.GetHashCode() * 79;
    }

    public override bool Equals(object? obj)
    {
        if (obj is null)
            return false;

        if (obj.GetType() != GetType())
            return false;

        if (obj is not Entity other)
            return false;

        return (Id == other.Id);
    }

    public bool Equals(Entity? other)
    {
        if (other is null)
            return false;

        if (other.GetType() != GetType())
            return false;

        return (Id == other.Id);
    }
}
