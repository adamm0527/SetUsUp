using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.Domain.ValueObjects;

public sealed class MusicalKeyTransition : ValueObject
{
    public string Value { get; }

    private MusicalKeyTransition(MixVariant mixVariant)
    {
        Value = mixVariant.AsStringValue();
    }

    public static MusicalKeyTransition? Create(MusicalKey? from, MusicalKey? to)
    {
        if (from is null || to is null)
            return null; // transition type cannot be determined, as keys aren't known

        int nrDiff = (int)to.Nr - (int)from.Nr;
        bool ltDiff = (to.IsMajor != from.IsMajor);
        switch (nrDiff)
        {
            // order: from "Perfect Matches" to rarer ones

            case 0: return (!ltDiff)
                ? new MusicalKeyTransition(MixVariant.ExactMatch)
                : new MusicalKeyTransition(MixVariant.Scale);

            case +1: if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.Boost);
                else if (from.IsMajor)
                    return new MusicalKeyTransition(MixVariant.DiagonalMajorUp);
                else
                    return new MusicalKeyTransition(MixVariant.DiagonalAtonalMinorUp);
                // break; // unreachable
            
            case -1: if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.Drop);
                else if (!from.IsMajor)
                    return new MusicalKeyTransition(MixVariant.DiagonalMinorDown);
                else
                    return new MusicalKeyTransition(MixVariant.DiagonalAtonalMajorDown);
                // break; // unreachable

            case +2: if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.EnergyBoostBig);
                break;

            case -2: if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.EnergyDropBig);
                break;

            case +7: if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.EnergyBoost);
                break;

            case -7: if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.EnergyDrop);
                break;

            case +3:
            case -9: // (equivalent to +3 (mod 12))
                if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.PayAttentionPlus);
                else if (!from.IsMajor)
                    return new MusicalKeyTransition(MixVariant.MoodShiftMinorUp);
                break;

            case -3:
            case +9: // (equivalent to -3 (mod 12))
                if (!ltDiff) // this is an odd one, but have to be handled here
                    return new MusicalKeyTransition(MixVariant.PayAttentionMinus);
                else if (from.IsMajor)
                    return new MusicalKeyTransition(MixVariant.MoodShiftMajorDown);
                break;

            case +4:
            case -8: // (equivalent to +4 (mod 12))
                if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.FlatFourUp);
                else if (from.IsMajor)
                    return new MusicalKeyTransition(MixVariant.FlatMajorToMinorUp);
                break;

            case -4:
            case +8: // (equivalent to -4 (mod 12))
                if (ltDiff && !from.IsMajor)
                    return new MusicalKeyTransition(MixVariant.FlatMinorToMajorDown);
                break;

            case +6:
            case -6:
                if (!ltDiff)
                    return new MusicalKeyTransition(MixVariant.HarmonicFlip);
                break;

            // any other case, not matching any meaningful predefined MixVariant
            default:
                return new MusicalKeyTransition(MixVariant.Different);
        }
        return new MusicalKeyTransition(MixVariant.Different);
    }

    public override object GetAtomicValue()
    {
        return Value;
    }

    public enum MixVariant
    {
        ExactMatch,                 // same Nr and Scale,    e.g. 4A to 4A
        Boost,                      // +1 Nr, same Scale,    e.g. 4A to 5A
        Drop,                       // -1 Nr, same Scale,    e.g. 4A to 3A
        Scale,                      // same Nr opp Scale,    e.g. 4A to 4B
        DiagonalMinorDown,          // -1 Nr, opp. Scale,    e.g. 4A to 3B
        DiagonalMajorUp,            // +1 Nr, opp. Scale,    e.g. 4B to 5A
        DiagonalAtonalMinorUp,      // +1 Nr, opp. Scale,    e.g. 4A to 5B
        DiagonalAtonalMajorDown,    // -1 Nr, opp. Scale,    e.g. 4B to 3A
        EnergyBoostBig,             // +2 Nr, same Scale,    e.g. 4A to 6A
        EnergyDropBig,              // -2 Nr, same Scale,    e.g. 4A to 2A
        EnergyBoost,                // +7 Nr, same Scale,    e.g. 4A to 11A
        EnergyDrop,                 // -7 Nr, same Scale,    e.g. 4A to 9A
        PayAttentionPlus,           // +3 Nr, same Scale,    e.g. 4A to 7A
        PayAttentionMinus,          // -3 Nr, same Scale,    e.g. 4A to 1A
        MoodShiftMinorUp,           // +3 Nr, opp. Scale,    e.g. 4A to 7B
        MoodShiftMajorDown,         // -3 Nr, opp. Scale,    e.g. 4B to 1A
        FlatMinorToMajorDown,       // -4 Nr, opp. Scale,    e.g. 4A to 12B
        FlatMajorToMinorUp,         // +4 Nr, opp. Scale,    e.g. 4B to 8A
        FlatFourUp,                 // +4 Nr, same Scale,    e.g. 4A to 8A
        HarmonicFlip,               // +6 Nr, same Scale,    e.g. 4A to 10A
        Different   // anything different from the above, provided keys of the transition are known
    }
}

public static class Extensions
{
    public static string AsStringValue(this MusicalKeyTransition.MixVariant mixVariant)
    {
        switch (mixVariant)
        {
            case MusicalKeyTransition.MixVariant.ExactMatch:                return "00X";
            case MusicalKeyTransition.MixVariant.Boost:                     return "+1X";
            case MusicalKeyTransition.MixVariant.Drop:                      return "-1X";
            case MusicalKeyTransition.MixVariant.Scale:                     return "00C";
            case MusicalKeyTransition.MixVariant.DiagonalMinorDown:         return "-1C";
            case MusicalKeyTransition.MixVariant.DiagonalMajorUp:           return "+1C";
            case MusicalKeyTransition.MixVariant.DiagonalAtonalMinorUp:     return "+1c";
            case MusicalKeyTransition.MixVariant.DiagonalAtonalMajorDown:   return "-1c";
            case MusicalKeyTransition.MixVariant.EnergyBoostBig:            return "+2X";
            case MusicalKeyTransition.MixVariant.EnergyDropBig:             return "-2X";
            case MusicalKeyTransition.MixVariant.EnergyBoost:               return "+7X";
            case MusicalKeyTransition.MixVariant.EnergyDrop:                return "-7X";
            case MusicalKeyTransition.MixVariant.PayAttentionPlus:          return "+3X";
            case MusicalKeyTransition.MixVariant.PayAttentionMinus:         return "-3X";
            case MusicalKeyTransition.MixVariant.MoodShiftMinorUp:          return "+3C";
            case MusicalKeyTransition.MixVariant.MoodShiftMajorDown:        return "-3C";
            case MusicalKeyTransition.MixVariant.FlatMinorToMajorDown:      return "-4C";
            case MusicalKeyTransition.MixVariant.FlatMajorToMinorUp:        return "+4C";
            case MusicalKeyTransition.MixVariant.FlatFourUp:                return "+4X";
            case MusicalKeyTransition.MixVariant.HarmonicFlip:              return "+6X";
            case MusicalKeyTransition.MixVariant.Different:                 return "DIF";

            default:
                throw new ArgumentException("Invalid mix variant supplied.");
        }
    }
}
