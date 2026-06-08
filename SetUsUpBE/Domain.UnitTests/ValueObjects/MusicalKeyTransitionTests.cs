using FluentAssertions;
using SetUsUpBE.Domain.ValueObjects;

namespace Domain.UnitTests.ValueObjects;

public sealed class MusicalKeyTransitionTests
{
    readonly MusicalKey[] minorKeys = new MusicalKey[12];
    readonly MusicalKey[] majorKeys = new MusicalKey[12];

    public MusicalKeyTransitionTests()
    {
        for (uint nr = 1U; nr <= 12U; nr++)
        {
            var resultKey = MusicalKey.Create($"{nr}A");
            resultKey.HasSucceeded.Should().BeTrue();
            resultKey.Value.Should().NotBeNull();
            minorKeys[nr - 1] = resultKey.Value;

            resultKey = MusicalKey.Create($"{nr}B");
            resultKey.HasSucceeded.Should().BeTrue();
            resultKey.Value.Should().NotBeNull();
            majorKeys[nr - 1] = resultKey.Value;
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_Unknown()
    {
        var transition = MusicalKeyTransition.Create(null, null);
        transition.Should().BeNull();

        var validKey = minorKeys[4];
        transition = MusicalKeyTransition.Create(validKey, null);
        transition.Should().BeNull();

        transition = MusicalKeyTransition.Create(null, validKey);
        transition.Should().BeNull();
    }

    [Fact]
    public void Check_Should_NotReturnError_MinorsToMajors()
    {
        for (int min_idx = 0; min_idx < 12; min_idx++)
        {
            var keyFrom = minorKeys[min_idx];
            for (int maj_idx = 0; maj_idx < 12; maj_idx++) // scale always changes
            {
                var keyTo = majorKeys[maj_idx];
                var transition = MusicalKeyTransition.Create(keyFrom, keyTo);
                transition.Should().NotBeNull();

                int nrDiff = maj_idx - min_idx;
                switch (nrDiff)
                {
                    case  0: transition.Value.Should().Be("00C"); break; // Scale
                    case -1: transition.Value.Should().Be("-1C"); break; // DiagonalMinorDown,
                    case +1: transition.Value.Should().Be("+1c"); break; // DiagonalAtonalMinorUp
                    case +3: // (-9 is also equivalent to +3 (mod 12))
                    case -9: transition.Value.Should().Be("+3C"); break; // MoodShiftMinorUp
                    // case -3: ...MinorDown doesn't exist!
                    case -4: // (+8 is also equivalent to -4 (mod 12))
                    case +8: transition.Value.Should().Be("-4C"); break; // FlatMinorToMajorDown
                    // case +4: ...MinorUp doesn't exist!

                    default: transition.Value.Should().Be("DIF");
                        break;
                }
            }
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_MajorsToMinors()
    {
        for (int maj_idx = 0; maj_idx < 12; maj_idx++)
        {
            var keyFrom = majorKeys[maj_idx];
            for (int min_idx = 0; min_idx < 12; min_idx++)
            {
                var keyTo = minorKeys[min_idx];
                var transition = MusicalKeyTransition.Create(keyFrom, keyTo);
                transition.Should().NotBeNull();

                int nrDiff = min_idx - maj_idx;
                switch (nrDiff)
                {
                    case  0: transition.Value.Should().Be("00C"); break; // Scale
                    case +1: transition.Value.Should().Be("+1C"); break; // DiagonalMajorUp
                    case -1: transition.Value.Should().Be("-1c"); break; // DiagonalAtonalMajorDown
                    case -3: // (+9 is also equivalent to -3 (mod 12))
                    case +9: transition.Value.Should().Be("-3C"); break; // MoodShiftMajorDown
                    // case +3: ...MajorUp doesn't exist!
                    case +4: // (-8 is also equivalent to +4 (mod 12))
                    case -8: transition.Value.Should().Be("+4C"); break; // FlatMajorToMinorUp
                    // case -4: ...MajorDown doesn't exist!

                    default: transition.Value.Should().Be("DIF");
                        break;
                }
            }
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_SameToSame()
    {
        for (int from_idx = 0; from_idx < 12; from_idx++)
        {
            var keyFromMinor = minorKeys[from_idx];
            var keyFromMajor = majorKeys[from_idx];
            for (int to_idx = 0; to_idx < 12; to_idx++)
            {
                var keyToMinor = minorKeys[to_idx];
                var keyToMajor = majorKeys[to_idx];
                var transitionMinor = MusicalKeyTransition.Create(keyFromMinor, keyToMinor);
                var transitionMajor = MusicalKeyTransition.Create(keyFromMajor, keyToMajor);
                transitionMinor.Should().NotBeNull();
                transitionMajor.Should().NotBeNull();

                int nrDiff = to_idx - from_idx;
                switch (nrDiff)
                {
                    case  0: // ExactMatch
                        transitionMinor.Value.Should().Be("00X");
                        transitionMajor.Value.Should().Be("00X");
                        break;

                    case +1: // Boost
                        transitionMinor.Value.Should().Be("+1X");
                        transitionMajor.Value.Should().Be("+1X");
                        break;

                    case -1: // Drop
                        transitionMinor.Value.Should().Be("-1X");
                        transitionMajor.Value.Should().Be("-1X");
                        break;

                    case +2: // EnergyBoostBig
                        transitionMinor.Value.Should().Be("+2X");
                        transitionMajor.Value.Should().Be("+2X");
                        break;

                    case -2: // EnergyDropBig
                        transitionMinor.Value.Should().Be("-2X");
                        transitionMajor.Value.Should().Be("-2X");
                        break;

                    case +3: // PayAttentionPlus
                    case -9: // (equivalent to +3 (mod 12))
                        transitionMinor.Value.Should().Be("+3X");
                        transitionMinor.Value.Should().Be("+3X");
                        break;

                    case -3: // PayAttentionMinus
                    case +9: // (equivalent to -3 (mod 12))
                        transitionMinor.Value.Should().Be("-3X");
                        transitionMajor.Value.Should().Be("-3X");
                        break;

                    case +4: // FlatFourUp
                    case -8: // (equivalent to -3 (mod 12))
                        transitionMinor.Value.Should().Be("+4X");
                        transitionMajor.Value.Should().Be("+4X");
                        break;

                    case +7: // EnergyBoost
                        transitionMinor.Value.Should().Be("+7X");
                        transitionMajor.Value.Should().Be("+7X");
                        break;

                    case -7: // EnergyDrop
                        transitionMinor.Value.Should().Be("-7X");
                        transitionMajor.Value.Should().Be("-7X");
                        break;

                    case +6: // HarmonicFlip
                    case -6:
                        transitionMinor.Value.Should().Be("+6X");
                        transitionMajor.Value.Should().Be("+6X");
                        break;

                    default:
                        transitionMinor.Value.Should().Be("DIF");
                        transitionMajor.Value.Should().Be("DIF");
                        break;
                }
            }
        }
    }
}
