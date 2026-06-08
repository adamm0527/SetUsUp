using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.Domain.DomainEvents;

public sealed class PlaylistOrderChanged : DomainEvent
{
    public uint CurrNr { get; private set; }
    public uint MaxNr { get; private set; }

    private PlaylistOrderChanged(uint maxNr)
    {
        CurrNr = 1U;
        if (maxNr == 0U)
        {
            MaxNr = CurrNr;
            Handled = true;
        }
        else
            MaxNr = maxNr;
    }

    public static PlaylistOrderChanged Raise(uint maxNr)
    {
        return new PlaylistOrderChanged(maxNr);
    }

    public uint GetNextNr()
    {
        uint prevCurrNr = CurrNr;
        CurrNr++;
        if (CurrNr > MaxNr)
            Handled = true;
        
        return prevCurrNr;
    }
}
