using FluentAssertions;
using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Domain.ValueObjects;

namespace Domain.UnitTests.DomainEntities;

public sealed class SongTests
{
    readonly TimeOnly exampDur = TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(120));

    [Fact]
    public void Check_Should_ReturnError_When_Artist_NullOrEmpty()
    {
        // testing Domain breaching creation

        var resultSongNullArtist = Song.Create(null!, "title", exampDur, 128);
        resultSongNullArtist.Error.Should().Be(Error.SongArtistEmpty);

        var resultSongEmptyArtist = Song.Create("", "title", exampDur, 128);
        resultSongEmptyArtist.Error.Should().Be(Error.SongArtistEmpty);

        var resultSongEmptyArtistAfterTrimming = Song.Create("  ", "title", exampDur, 128);
        resultSongEmptyArtistAfterTrimming.Error.Should().Be(Error.SongArtistEmpty);


        // testing Domain breaching mutation

        var resultSongValid = Song.Create("artist", "title", exampDur, 128);
        resultSongValid.HasSucceeded.Should().BeTrue();
        var validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();

        validSong.SetArtist(null!).Error.Should().Be(Error.SongArtistEmpty);
        validSong.SetArtist("").Error.Should().Be(Error.SongArtistEmpty);
        validSong.SetArtist(" ").Error.Should().Be(Error.SongArtistEmpty);
        validSong.SetArtist("   ").Error.Should().Be(Error.SongArtistEmpty);
    }

    [Fact]
    public void Check_Should_ReturnError_When_Title_NullOrEmpty()
    {
        // testing Domain breaching creation

        var resultSongNullTitle = Song.Create("artist", null!, exampDur, 128);
        resultSongNullTitle.Error.Should().Be(Error.SongTitleEmpty);

        var resultSongEmptyTitle = Song.Create("artist", "", exampDur, 128);
        resultSongEmptyTitle.Error.Should().Be(Error.SongTitleEmpty);

        var resultSongEmptyTitleAfterTrimming = Song.Create("artist", "  ", exampDur, 128);
        resultSongEmptyTitleAfterTrimming.Error.Should().Be(Error.SongTitleEmpty);


        // testing Domain breaching mutation

        var resultSongValid = Song.Create("artist", "title", exampDur, 128);
        resultSongValid.HasSucceeded.Should().BeTrue();
        var validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();

        validSong.SetTitle(null!).Error.Should().Be(Error.SongTitleEmpty);
        validSong.SetTitle("").Error.Should().Be(Error.SongTitleEmpty);
        validSong.SetTitle(" ").Error.Should().Be(Error.SongTitleEmpty);
        validSong.SetTitle("   ").Error.Should().Be(Error.SongTitleEmpty);
    }

    [Fact]
    public void Check_Should_ReturnError_When_Duration_OutsideDomain()
    {
        // testing Domain breaching creation

        var resultSongTooShort = Song.Create("artist", "title", 
            TimeOnly.FromTimeSpan(TimeSpan.FromMilliseconds(999)), 128);
        resultSongTooShort.Error.Should().Be(Error.SongDurationDomainError);
        try
        {
            var resultSongTooLongThrows = Song.Create("artist", "title",
                TimeOnly.FromTimeSpan(TimeSpan.FromHours(24.0)), 128);
        }
        catch (Exception ex)
        {
            ex.Should().BeOfType<ArgumentOutOfRangeException>();
        }

        // testing Domain breaching mutation

        var resultSongValid1 = Song.Create("artist", "title", TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(1)), 128);
        resultSongValid1.HasSucceeded.Should().BeTrue();
        var validSong1 = resultSongValid1.Value;
        validSong1.Should().NotBeNull();

        validSong1.SetDuration(TimeOnly.FromTimeSpan(TimeSpan.FromMilliseconds(999.5)))
            .Error.Should().Be(Error.SongDurationDomainError);

        var resultSongValid2 = Song.Create("artist", "title", TimeOnly.FromTimeSpan(TimeSpan.FromMinutes(60 * 23 + 59.5)), 128);
        resultSongValid2.HasSucceeded.Should().BeTrue();
        var validSong2 = resultSongValid2.Value;
        validSong2.Should().NotBeNull();
        try
        {
            var resultSongTooLongThrows = 
                validSong2.SetDuration(TimeOnly.FromTimeSpan(TimeSpan.FromHours(24.0)));
        }
        catch (Exception ex)
        {
            ex.Should().BeOfType<ArgumentOutOfRangeException>();
        }
    }

    [Fact]
    public void Check_Should_ReturnError_When_Bpm_OutsideDomain()
    {
        // testing Domain breaching creation

        var resultSongBpmNegative = Song.Create("artist", "title", exampDur, -0.005M);
        resultSongBpmNegative.Error.Should().Be(Error.SongBpmDomainError);

        var resultSongBpmTooMuch = Song.Create("artist", "title", exampDur, 300.0001M);
        resultSongBpmTooMuch.Error.Should().Be(Error.SongBpmDomainError);


        // testing Domain breaching mutation

        var resultSongValid = Song.Create("artist", "title", exampDur, 0.0M);
        resultSongValid.HasSucceeded.Should().BeTrue();
        resultSongValid = Song.Create("artist", "title", exampDur, 300.0M);
        resultSongValid.HasSucceeded.Should().BeTrue();
        var validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();

        validSong.SetBpm(-0.0001M).Error.Should().Be(Error.SongBpmDomainError);
        validSong.SetBpm(300.00005M).Error.Should().Be(Error.SongBpmDomainError);
    }

    [Fact]
    public void Check_Should_ReturnError_When_BpmOut_OutsideDomain()
    {
        // testing Domain breaching creation

        var resultSongBpmOutNegative = Song.Create("artist", "title", exampDur, 128, -0.005M);
        resultSongBpmOutNegative.Error.Should().Be(Error.SongBpmDomainError);

        var resultSongBpmOutTooMuch = Song.Create("artist", "title", exampDur, 128, 300.0001M);
        resultSongBpmOutTooMuch.Error.Should().Be(Error.SongBpmDomainError);


        // testing Domain breaching mutation

        var resultSongValid = Song.Create("artist", "title", exampDur, 0.0M);
        resultSongValid.HasSucceeded.Should().BeTrue();
        resultSongValid = Song.Create("artist", "title", exampDur, 300.0M);
        resultSongValid.HasSucceeded.Should().BeTrue();
        var validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();

        validSong.SetBpmOut(-0.0001M).Error.Should().Be(Error.SongBpmDomainError);
        validSong.SetBpmOut(300.00005M).Error.Should().Be(Error.SongBpmDomainError);
    }

    [Fact]
    public void Check_Should_ReturnError_When_Bpm_Zero_Mismatch()
    {
        // testing Domain breaching creation
        
        var resultBpmZero_BpmOutNonZero = Song.Create("artist", "title", exampDur, 0, 0.001M);
        resultBpmZero_BpmOutNonZero.Error.Should().Be(Error.SongBpmBeatlessMismatch);

        var resultBpmNonZero_BpmOutZero = Song.Create("artist", "title", exampDur, 0.001M, 0);
        resultBpmNonZero_BpmOutZero.Error.Should().Be(Error.SongBpmBeatlessMismatch);


        // testing when bpmOut is not specified

        var resultSongValid = Song.Create("artist", "title", exampDur, 0.0M);
        resultSongValid.HasSucceeded.Should().BeTrue();
        var validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();
        validSong.GetBpmOut().Should().Be(0.0M); // should be same as bpm


        // when Bpm and BpmOut are the same, setting Bpm should also set BpmOut

        var setResult = validSong.SetBpm(90.5M); // bpm=0, bpmOut=0 shouldn't lock the object indefinitely
        setResult.HasSucceeded.Should().BeTrue();
        validSong.GetBpm().Should().Be(90.5M);
        validSong.GetBpmOut().Should().Be(90.5M);

        setResult = validSong.SetBpmOut(110.0M);
        setResult.HasSucceeded.Should().BeTrue();
        validSong.GetBpm().Should().Be(90.5M); // but not when setting bpmOut
        validSong.GetBpmOut().Should().Be(110.0M);


        // testing Domain breaching mutation

        setResult = validSong.SetBpm(0.0M); // cannot set bpm to zero when bpmOut is non-zero
        setResult.HasFailed.Should().BeTrue();
        validSong.GetBpm().Should().Be(90.5M);
        validSong.GetBpmOut().Should().Be(110.0M);

        setResult = validSong.SetBpmOut(0.0M); // cannot set bpmOut to zero when bpm is non-zero
        setResult.HasFailed.Should().BeTrue();
        validSong.GetBpm().Should().Be(90.5M);
        validSong.GetBpmOut().Should().Be(110.0M);

        validSong.SetBpm(validSong.GetBpmOut()); // syncing bpm and bpmOut again
        validSong.SetBpm(0.0M); // this sets both bpm and bpmOut to 0, as tested previously
        setResult = validSong.SetBpmOut(90.0M); // cannot set bpmOut to non-zero value, when bpm is zero
        setResult.HasFailed.Should().BeTrue();
        validSong.GetBpm().Should().Be(0.0M);
        validSong.GetBpmOut().Should().Be(0.0M);
    }

    [Fact]
    public void Check_Should_ReturnError_When_Setting_Wrong_ValueObjects()
    {
        // testing Domain breaching creation

        var resultSong = Song.Create("artist", "title", exampDur, 128, null, "13A");
        resultSong.Error.Should().Be(Error.MusicalKeyDomainError);
        resultSong.Value.Should().BeNull();

        resultSong = Song.Create("artist", "title", exampDur, 128, 130, "55e");
        resultSong.Error.Should().Be(Error.MusicalKeyInvalidFormat);
        resultSong.Value.Should().BeNull();


        // testing Domain breaching mutation

        var resultSongValid = Song.Create("artist", "title", exampDur, 128, null, "01A");
        resultSongValid.HasSucceeded.Should().BeTrue();
        var validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();

        var setResult = validSong.SetInitKey("");
        setResult.HasFailed.Should().BeTrue();
        validSong.GetInitKey()?.Value.Should().Be("01A");

        setResult = validSong.SetInitKey("00B");
        setResult.HasFailed.Should().BeTrue();
        validSong.GetInitKey()?.Value.Should().Be("01A");

        setResult = validSong.SetInitKey("A10");
        setResult.HasFailed.Should().BeTrue();
        validSong.GetInitKey()?.Value.Should().Be("01A");
    }

    [Fact]
    public void Check_Should_NotReturnError_When_Setting_ValueObjects()
    {
        var resultSongValid = Song.Create(" artist  ", "  title ", exampDur, 140, 150, "01A");
        resultSongValid.HasSucceeded.Should().BeTrue();
        var validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();

        // checking successful trimming of artist and title
        validSong.GetArtist().Should().Be("artist");
        validSong.GetTitle().Should().Be("title");
        validSong.SetArtist(" artist");
        validSong.SetTitle("title  ");
        validSong.GetArtist().Should().Be("artist");
        validSong.GetTitle().Should().Be("title");

        // testing creation
        for (int i = 1; i <= 12; ++i)
        {
            for (char c = 'A'; c <= 'B'; ++c)
            {
                string initKeyStr = (i >= 10) ? $"{i}{c}" : $"0{i}{c}";
                resultSongValid = Song.Create("artist", "title", exampDur, 140, 150, initKeyStr);
                resultSongValid.HasSucceeded.Should().BeTrue();
                validSong = resultSongValid.Value;
                validSong.Should().NotBeNull();
                var keyField = validSong.GetInitKey();
                keyField.Should().NotBeNull();
                validSong.IsKeySet().Should().BeTrue();
                keyField.Value.Should().Be(initKeyStr);
            }
        }

        // testing mutation
        for (int i = 1; i <= 12; ++i)
        {
            for (char c = 'A'; c <= 'B'; ++c)
            {
                string initKeyStr = (i >= 10) ? $"{i}{c}" : $"0{i}{c}";
                var resultKey = MusicalKey.Create(initKeyStr);
                resultKey.HasSucceeded.Should().BeTrue();
                var key = resultKey.Value;

                // let's test both setting from MusicalKey Value Object, and also initKey string
                MusicalKey? keyField = null;
                if (i % 2 == 0) 
                    validSong.SetInitKey(key);
                else
                {
                    var setResult = validSong.SetInitKey(initKeyStr);
                    setResult.HasSucceeded.Should().BeTrue();
                }

                keyField = validSong.GetInitKey();
                keyField.Should().NotBeNull();
                validSong.IsKeySet().Should().BeTrue();
                keyField.Value.Should().Be(initKeyStr);
                keyField.Should().Be(resultKey.Value);
            }
        }

        // testing null key (when unspecified)
        validSong.SetInitKey((MusicalKey?)null);
        validSong.IsKeySet().Should().BeFalse();
        validSong.GetInitKey().Should().BeNull();

        resultSongValid = Song.Create("artist", "title", exampDur, 140, 150);
        resultSongValid.HasSucceeded.Should().BeTrue();
        validSong = resultSongValid.Value;
        validSong.Should().NotBeNull();
        validSong.IsKeySet().Should().BeFalse();
        validSong.GetInitKey().Should().BeNull();
    }
}
