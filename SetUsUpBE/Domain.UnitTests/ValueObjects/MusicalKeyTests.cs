using FluentAssertions;
using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.ValueObjects;

namespace Domain.UnitTests.ValueObjects;

public sealed class MusicalKeyTests
{
    readonly List<MusicalKey> validKeys = new List<MusicalKey>();

    public MusicalKeyTests()
    {
        for (int i = 1; i <= 12; ++i)
        {
            var keyA = MusicalKey.Create($"{i}A");
            var keyB = MusicalKey.Create($"{i}B");
            
            if (keyA.Value is not null)
                validKeys.Add(keyA.Value);
            if (keyB.Value is not null)
                validKeys.Add(keyB.Value);
        }
    }

    [Fact]
    public void Check_Should_ReturnError_When_Key_Empty()
    {
        Result<MusicalKey> empty = MusicalKey.Create("");
        empty.Error.Should().Be(Error.MusicalKeyInvalidFormat);
    }

    [Fact]
    public void Check_Should_ReturnError_When_Key_WrongLength()
    {
        Result<MusicalKey> tooShort = MusicalKey.Create("3");
        Result<MusicalKey> tooLong = MusicalKey.Create("003A");
        tooShort.Error.Should().Be(Error.MusicalKeyInvalidFormat);
        tooLong.Error.Should().Be(Error.MusicalKeyInvalidFormat);
    }

    [Fact]
    public void Check_Should_ReturnError_When_Key_NotStartingWithNr()
    {
        Result<MusicalKey> noNr = MusicalKey.Create("AB");
        noNr.Error.Should().Be(Error.MusicalKeyInvalidFormat);
    }

    [Fact]
    public void Check_Should_ReturnError_When_Key_NotEndingInUpperLetter()
    {
        Result<MusicalKey> noLt = MusicalKey.Create("075");
        Result<MusicalKey> noUpperLt = MusicalKey.Create("07a");
        noLt.Error.Should().Be(Error.MusicalKeyInvalidFormat);
        noUpperLt.Error.Should().Be(Error.MusicalKeyInvalidFormat);
    }

    [Fact]
    public void Check_Should_NotReturnError_ValidKeys()
    {
        var validKeyResults = new List<Result<MusicalKey>>();
        for (int i = 1; i <= 12; ++i)
        {
            validKeyResults.Add(MusicalKey.Create($"{i}A"));
            validKeyResults.Add(MusicalKey.Create($"{i}B"));
            if (i < 10)
            {
                var alternativeA = MusicalKey.Create($"0{i}A");
                var alternativeB = MusicalKey.Create($"0{i}B");
                alternativeA.HasSucceeded.Should().BeTrue();
                alternativeB.HasSucceeded.Should().BeTrue();
                validKeyResults.Contains(alternativeA).Should().BeTrue();
                validKeyResults.Contains(alternativeB).Should().BeTrue();
            }
        }

        foreach (var keyResult in validKeyResults)
        {
            keyResult.HasSucceeded.Should().BeTrue();

            var musicalKey = keyResult.Value;
            musicalKey.Should().NotBeNull(); 
            musicalKey.Value.Length.Should().Be(3);
        }
    }

    [Fact]
    public void Check_Should_ReturnError_Keys_OutsideDomain()
    {
        MusicalKey.Create("0A").Error.Should().Be(Error.MusicalKeyDomainError);
        MusicalKey.Create("0B").Error.Should().Be(Error.MusicalKeyDomainError);
        MusicalKey.Create("-1A").Error.Should().Be(Error.MusicalKeyDomainError);
        MusicalKey.Create("-1B").Error.Should().Be(Error.MusicalKeyDomainError);
        MusicalKey.Create("13A").Error.Should().Be(Error.MusicalKeyDomainError);
        MusicalKey.Create("13B").Error.Should().Be(Error.MusicalKeyDomainError);
        MusicalKey.Create("02C").Error.Should().Be(Error.MusicalKeyDomainError);
        MusicalKey.Create("8E").Error.Should().Be(Error.MusicalKeyDomainError);
    }

    [Fact]
    public void Check_Should_NotReturnError_PerfectMatches()
    {
        foreach (var key in validKeys)
        {
            var perfectMatches = key.GetPerfectMatches();
            perfectMatches.Count.Should().Be(5);
            perfectMatches.Contains(key).Should().BeTrue();
            perfectMatches.Contains(key.GetRelatedKey_Boost()).Should().BeTrue();
            perfectMatches.Contains(key.GetRelatedKey_Drop()).Should().BeTrue();
            perfectMatches.Contains(key.GetRelatedKey_Scale()).Should().BeTrue();
            perfectMatches.Contains(key.GetRelatedKey_Diagonal()).Should().BeTrue();
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys()
    {
        foreach (var key in validKeys)
        {
            var similarMatches = key.GetSimilarMatches();
            similarMatches.Count.Should().Be(10);
            similarMatches.Contains(key.GetSimilarKey_DiagonalAtonal()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_EnergyBoostBig()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_EnergyDropBig()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_PayAttentionPlus()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_PayAttentionMinus()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_MoodShift()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_EnergyBoost()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_EnergyDrop()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_FlatFourScale()).Should().BeTrue();
            similarMatches.Contains(key.GetSimilarKey_FlatFourUp()).Should().BeTrue();
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_AllMatches()
    {
        foreach (var key in validKeys)
        {
            var allMatches = key.GetAllMatches();
            allMatches.Count.Should().Be(15);
            allMatches.Contains(key).Should().BeTrue();
            allMatches.Contains(key.GetRelatedKey_Boost()).Should().BeTrue();
            allMatches.Contains(key.GetRelatedKey_Drop()).Should().BeTrue();
            allMatches.Contains(key.GetRelatedKey_Scale()).Should().BeTrue();
            allMatches.Contains(key.GetRelatedKey_Diagonal()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_DiagonalAtonal()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_EnergyBoostBig()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_EnergyDropBig()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_PayAttentionPlus()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_PayAttentionMinus()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_MoodShift()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_EnergyBoost()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_EnergyDrop()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_FlatFourScale()).Should().BeTrue();
            allMatches.Contains(key.GetSimilarKey_FlatFourUp()).Should().BeTrue();
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_RelatedKeys_Drop()
    {
        int total_checked = 0;

        // checking keys 02A to 12A
        for (int i = 0; i < validKeys.Count - 2; i += 2, ++total_checked)
        {
            var keyDropped = validKeys[i + 2].GetRelatedKey_Drop(); // 01A to 11A
            keyDropped.Should().Be(validKeys[i]);
        }

        // checking keys 02B to 12B
        for (int i = 1; i < validKeys.Count - 2; i += 2, ++total_checked)
        {
            var keyDropped = validKeys[i + 2].GetRelatedKey_Drop(); // 01B to 11B
            keyDropped.Should().Be(validKeys[i]);
        }

        // checking key 01A
        var key01A = MusicalKey.Create("01A").Value;
        var key12A = MusicalKey.Create("12A").Value;
        key01A.Should().NotBeNull();
        key12A.Should().NotBeNull();
        var key01A_drop = key01A.GetRelatedKey_Drop();
        key01A_drop.Should().Be(key12A);
        ++total_checked;

        // checking key 01B
        var key01B = MusicalKey.Create("01B").Value;
        var key12B = MusicalKey.Create("12B").Value;
        key01B.Should().NotBeNull();
        key12B.Should().NotBeNull();
        var key01B_drop = key01B.GetRelatedKey_Drop();
        key01B_drop.Should().Be(key12B);
        ++total_checked;

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_RelatedKeys_Boost()
    {
        int total_checked = 0;

        // checking keys 01A to 11A
        for (int i = 0; i < validKeys.Count - 2; i += 2, ++total_checked)
        {
            var keyBoost = validKeys[i].GetRelatedKey_Boost(); // 02A to 12A
            keyBoost.Should().Be(validKeys[i + 2]);
        }

        // checking keys 01B to 11B
        for (int i = 1; i < validKeys.Count - 2; i += 2, ++total_checked)
        {
            var keyBoost = validKeys[i].GetRelatedKey_Boost();
            keyBoost.Should().Be(validKeys[i + 2]); // 02B to 12B
        }

        // checking key 12A
        var key12A = MusicalKey.Create("12A").Value;
        var key01A = MusicalKey.Create("01A").Value;
        key12A.Should().NotBeNull();
        key01A.Should().NotBeNull();
        var key12A_boost = key12A.GetRelatedKey_Boost();
        key12A_boost.Should().Be(key01A);
        ++total_checked;

        // checking key 12B
        var key12B = MusicalKey.Create("12B").Value;
        var key01B = MusicalKey.Create("01B").Value;
        key12B.Should().NotBeNull();
        key01B.Should().NotBeNull();
        var key12B_boost = key12B.GetRelatedKey_Boost();
        key12B_boost.Should().Be(key01B);
        ++total_checked;

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_RelatedKeys_Scale()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyScale = validKeys[i].GetRelatedKey_Scale(); // 01B to 12B
            keyScale.Should().Be(validKeys[i + 1]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyScale = validKeys[i].GetRelatedKey_Scale(); // 01A to 12A
            keyScale.Should().Be(validKeys[i - 1]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_RelatedKeys_Diagonal()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var diagonalMajor = validKeys[i].GetRelatedKey_Diagonal(); // 12B to 11B
            int nxt_idx = (i - 1) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            diagonalMajor.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var diagonalMinor = validKeys[i].GetRelatedKey_Diagonal(); // 02A to 01A
            int nxt_idx = (i + 1) % validKeys.Count;
            diagonalMinor.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_DiagonalAtonal()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var diagonalAtonalMajor = validKeys[i].GetSimilarKey_DiagonalAtonal(); // 02B to 01B
            int nxt_idx = (i + 3) % validKeys.Count;
            diagonalAtonalMajor.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var diagonalMinor = validKeys[i].GetSimilarKey_DiagonalAtonal(); // 12A to 11A
            int nxt_idx = (i - 3) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            diagonalMinor.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_EnergyBoostBig()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExtraBoosted = validKeys[i].GetSimilarKey_EnergyBoostBig(); // 03A to 02A
            int nxt_idx = (i + 4) % validKeys.Count;
            keyExtraBoosted.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExtraBoosted = validKeys[i].GetSimilarKey_EnergyBoostBig(); // 03B to 02B
            int nxt_idx = (i + 4) % validKeys.Count;
            keyExtraBoosted.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_EnergyDropBig()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExxtraDropped = validKeys[i].GetSimilarKey_EnergyDropBig(); // 11A to 10A
            int nxt_idx = (i - 4) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            keyExxtraDropped.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExxtraDropped = validKeys[i].GetSimilarKey_EnergyDropBig(); // 11B to 10B
            int nxt_idx = (i - 4) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            keyExxtraDropped.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_EnergyBoost()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExtraBoosted = validKeys[i].GetSimilarKey_EnergyBoost(); // 08A to 07A
            int nxt_idx = (i + 14) % validKeys.Count;
            keyExtraBoosted.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExtraBoosted = validKeys[i].GetSimilarKey_EnergyBoost(); // 08B to 07B
            int nxt_idx = (i + 14) % validKeys.Count;
            keyExtraBoosted.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_EnergyDrop()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExtraDropped = validKeys[i].GetSimilarKey_EnergyDrop(); // 06A to 05A
            int nxt_idx = (i - 14) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            keyExtraDropped.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyExtraDropped = validKeys[i].GetSimilarKey_EnergyDrop(); // 06B to 05B
            int nxt_idx = (i - 14) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            keyExtraDropped.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_PayAttentionPlus()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyMinorThird = validKeys[i].GetSimilarKey_PayAttentionPlus(); // 04A to 03A
            int nxt_idx = (i + 6) % validKeys.Count;
            keyMinorThird.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyMajorThird = validKeys[i].GetSimilarKey_PayAttentionPlus(); // 04B to 03B
            int nxt_idx = (i + 6) % validKeys.Count;
            keyMajorThird.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_PayAttentionMinus()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyMinorThird = validKeys[i].GetSimilarKey_PayAttentionMinus(); // 10A to 09A
            int nxt_idx = (i + 18) % validKeys.Count;
            keyMinorThird.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyMajorThird = validKeys[i].GetSimilarKey_PayAttentionMinus(); // 10B to 09B
            int nxt_idx = (i + 18) % validKeys.Count;
            keyMajorThird.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_MoodShift()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyMoodShifted = validKeys[i].GetSimilarKey_MoodShift(); // 04B to 03B
            int nxt_idx = (i + 7) % validKeys.Count;
            keyMoodShifted.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyMoodShifted = validKeys[i].GetSimilarKey_MoodShift(); // 10A to 09A
            int nxt_idx = (i - 7) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            keyMoodShifted.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_FlatFourScale()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyFlatMajor = validKeys[i].GetSimilarKey_FlatFourScale(); // 09B to 08B
            int nxt_idx = (i - 7) % validKeys.Count;
            if (nxt_idx < 0) nxt_idx += validKeys.Count;
            keyFlatMajor.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyFlatMinor = validKeys[i].GetSimilarKey_FlatFourScale(); // 05A to 04A
            int nxt_idx = (i + 7) % validKeys.Count;
            keyFlatMinor.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_SimilarKeys_FlatFourUp()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyFlatFour = validKeys[i].GetSimilarKey_FlatFourUp(); // 05A to 04A
            int nxt_idx = (i + 8) % validKeys.Count;
            keyFlatFour.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyFlatFour = validKeys[i].GetSimilarKey_FlatFourUp(); // 05B to 04B
            int nxt_idx = (i + 8) % validKeys.Count;
            keyFlatFour.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }

    [Fact]
    public void Check_Should_NotReturnError_HarmonicFlip()
    {
        int total_checked = 0;

        // checking keys 01A to 12A
        for (int i = 0; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyFlipped = validKeys[i].GetHarmonicFlip(); // 07A to 06A
            int nxt_idx = (i + 12) % validKeys.Count;
            keyFlipped.Should().Be(validKeys[nxt_idx]);
        }

        // checking keys 01B to 12B
        for (int i = 1; i < validKeys.Count; i += 2, ++total_checked)
        {
            var keyFlipped = validKeys[i].GetHarmonicFlip(); // 07B to 06B
            int nxt_idx = (i + 12) % validKeys.Count;
            keyFlipped.Should().Be(validKeys[nxt_idx]);
        }

        total_checked.Should().Be(validKeys.Count);
    }
}
