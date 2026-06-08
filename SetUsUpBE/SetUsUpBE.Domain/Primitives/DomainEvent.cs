namespace SetUsUpBE.Domain.Primitives;

public abstract class DomainEvent
{
    public bool Handled { get; protected set; }

    protected DomainEvent() => Handled = false;
}
