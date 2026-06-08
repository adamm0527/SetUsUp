using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.Domain.ValueObjects;

public sealed class MusicalKey : ValueObject
{
    public string Value { get; }
    internal uint Nr { get; set; }
    internal bool IsMajor { get; set; }

    private MusicalKey(uint number, bool isMajor)
    {
        char letter = isMajor ? 'B' : 'A';

        this.Value = (number >= 10) ? $"{number}{letter}" : $"0{number}{letter}";
        this.Nr = number;
        this.IsMajor = isMajor;
    }

    public static Result<MusicalKey> Create(string camelotKey)
    {
        // checking Key not to be empty or too short
        if (string.IsNullOrEmpty(camelotKey) || camelotKey.Length < 2)
            return Result<MusicalKey>.Failure(Error.MusicalKeyInvalidFormat);

        // separating the number and the letter part of the Key
        string nr_part = camelotKey.Substring(0, camelotKey.Length - 1);
        string lt_part = camelotKey.Substring(camelotKey.Length - 1);

        int nr; // checking if number part is a valid number
        if (nr_part.Length > 2 || !int.TryParse(nr_part, out nr))
            return Result<MusicalKey>.Failure(Error.MusicalKeyInvalidFormat);

        char lt = lt_part[0]; // checking if letter part is a valid uppercase character
        if (!char.IsLetter(lt) || !char.IsUpper(lt))
            return Result<MusicalKey>.Failure(Error.MusicalKeyInvalidFormat);

        // checking Key to be in valid domain
        if (nr < 1 || nr > 12 || (lt != 'A' && lt != 'B'))
            return Result<MusicalKey>.Failure(Error.MusicalKeyDomainError);

        MusicalKey resultKey = new MusicalKey((uint)nr, (lt == 'B'));
        return Result<MusicalKey>.Success(resultKey);
    }

    public override object GetAtomicValue()
    {
        return Value;
    }


    // the following functions all return valid keys
    // (once we have a valid key, we can determine all its related keys without any possibility of a "Domain breach")

    public List<MusicalKey> GetPerfectMatches()
    {
        return new List<MusicalKey>
        {
            this,
            GetRelatedKey_Drop(),
            GetRelatedKey_Boost(),
            GetRelatedKey_Scale(),
            GetRelatedKey_Diagonal(),
        };
    }

    public List<MusicalKey> GetSimilarMatches()
    {
        var list = new List<MusicalKey>()
        {
            GetSimilarKey_DiagonalAtonal(),
            GetSimilarKey_EnergyBoostBig(),
            GetSimilarKey_EnergyDropBig(),
            GetSimilarKey_PayAttentionPlus(),
            GetSimilarKey_PayAttentionMinus(),
            GetSimilarKey_MoodShift(),
            GetSimilarKey_EnergyBoost(),
            GetSimilarKey_EnergyDrop(),
            GetSimilarKey_FlatFourScale(),
            GetSimilarKey_FlatFourUp()
        };

        return list;
    }

    public List<MusicalKey> GetAllMatches()
    {
        var allMatches = GetPerfectMatches();
        allMatches.AddRange(GetSimilarMatches());
        return allMatches;
    }

    public MusicalKey GetRelatedKey_Drop()
    {
        uint result_nr = Nr - 1;
        if (result_nr == 0)
            result_nr = 12;

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetRelatedKey_Boost()
    {
        uint result_nr = Nr + 1;
        if (result_nr == 13)
            result_nr = 1;

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetRelatedKey_Scale()
    {
        return new MusicalKey(Nr, !IsMajor); // the opposite scale
    }

    public MusicalKey GetRelatedKey_Diagonal()
    {
        var keyScaleChanged = GetRelatedKey_Scale();

        if (keyScaleChanged.IsMajor)
            return keyScaleChanged.GetRelatedKey_Drop();
        else
            return keyScaleChanged.GetRelatedKey_Boost();
    }

    public MusicalKey GetSimilarKey_DiagonalAtonal()
    {
        var keyScaleChanged = GetRelatedKey_Scale();

        if (keyScaleChanged.IsMajor)
            return keyScaleChanged.GetRelatedKey_Boost();
        else
            return keyScaleChanged.GetRelatedKey_Drop();
    }

    public MusicalKey GetSimilarKey_EnergyBoostBig()
    {
        uint result_nr = Nr + 2;
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetSimilarKey_EnergyDropBig()
    {
        uint result_nr = Nr + 10; // equivalent of -2 (mod 12)
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetSimilarKey_EnergyBoost()
    {
        uint result_nr = Nr + 7;
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetSimilarKey_EnergyDrop()
    {
        uint result_nr = Nr + 5; // equivalent of -7 (mod 12)
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetSimilarKey_PayAttentionPlus()
    {
        uint result_nr = Nr + 3;
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetSimilarKey_PayAttentionMinus()
    {
        uint result_nr = Nr + 9; // equivalent of -3 (mod 12)
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetSimilarKey_MoodShift()
    {
        var keyScaleChanged = GetRelatedKey_Scale();
        uint result_nr = Nr;
        if (keyScaleChanged.IsMajor)
        {
            result_nr += 3;
            NormaliseDown_(ref result_nr);
        }
        else
        {
            result_nr += 9; // equivalent of -3 (mod 12)
            NormaliseDown_(ref result_nr);
        }
        
        return new MusicalKey(result_nr, keyScaleChanged.IsMajor);
    }

    public MusicalKey GetSimilarKey_FlatFourScale()
    {
        var keyScaleChanged = GetRelatedKey_Scale();
        uint result_nr = Nr;
        if (keyScaleChanged.IsMajor)
        {
            result_nr += 8; // equivalent of -4 (mod 12)
            NormaliseDown_(ref result_nr);
        }
        else
        {
            result_nr += 4;
            NormaliseDown_(ref result_nr);
        }

        return new MusicalKey(result_nr, keyScaleChanged.IsMajor);
    }

    public MusicalKey GetSimilarKey_FlatFourUp()
    {
        uint result_nr = Nr + 4;
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    public MusicalKey GetHarmonicFlip()
    {
        uint result_nr = Nr + 6;
        NormaliseDown_(ref result_nr);

        return new MusicalKey(result_nr, IsMajor);
    }

    private static void NormaliseDown_(ref uint key_nr)
    {
        if (key_nr > 12)
            key_nr -= 12;
    }
}
