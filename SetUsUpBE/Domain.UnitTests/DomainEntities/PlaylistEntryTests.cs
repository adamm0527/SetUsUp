using FluentAssertions;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Domain.Primitives;
using System.Drawing;

namespace Domain.UnitTests.DomainEntities;

public sealed class PlaylistEntryTests
{
    readonly TimeOnly songDuration;
    readonly Song validSong;
    readonly Group validGroup;
    readonly Playlist validPlaylist;
    readonly PlaylistEntry validPlaylistEntry;

    public PlaylistEntryTests()
    {
        songDuration = TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(120));
        var resultSong = Song.Create("artist", "title", songDuration, 128);
        resultSong.HasSucceeded.Should().BeTrue();
        resultSong.Value.Should().NotBeNull();
        validSong = resultSong.Value;

        var groupResult = Group.Create(true, "group");
        groupResult.HasSucceeded.Should().BeTrue();
        groupResult.Value.Should().NotBeNull();
        validGroup = groupResult.Value;

        var playlistResult = Playlist.Create(validGroup, "playlist");
        playlistResult.HasSucceeded.Should().BeTrue();
        playlistResult.Value.Should().NotBeNull();
        validPlaylist = playlistResult.Value;

        var resultPlaylistEntry = PlaylistEntry.Create(validSong, validPlaylist, TimeOnly.MinValue, songDuration);
        resultPlaylistEntry.HasSucceeded.Should().BeTrue();
        resultPlaylistEntry.Value.Should().NotBeNull();
        validPlaylistEntry = resultPlaylistEntry.Value;
    }

    [Fact]
    public void Check_Should_ReturnError_When_DurationTooLong()
    {
        // testing Domain breaching creation

        var resultTooLong = PlaylistEntry.Create(validSong, validPlaylist, TimeOnly.MinValue, TimeOnly.MaxValue);
        resultTooLong.Error.Should().Be(Error.PlaylistEntryDurationTooLong);

        resultTooLong = PlaylistEntry.Create(validSong, validPlaylist,
            TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(14)),
            TimeOnly.FromTimeSpan(validSong.GetDuration().ToTimeSpan() + TimeSpan.FromMilliseconds(1)));
        resultTooLong.Error.Should().Be(Error.PlaylistEntryDurationTooLong);


        // testing Domain breaching mutation

        validPlaylistEntry.SetEnd(TimeOnly.MaxValue)
            .Error.Should().Be(Error.PlaylistEntryDurationTooLong);

        validPlaylistEntry.SetEnd(TimeOnly.FromTimeSpan(songDuration.ToTimeSpan() + TimeSpan.FromMilliseconds(1)))
            .Error.Should().Be(Error.PlaylistEntryDurationTooLong);
    }

    [Fact]
    public void Check_Should_ReturnError_When_DurationTooSmall()
    {
        // testing Domain breaching creation

        var resultTooSmall = PlaylistEntry.Create(validSong, validPlaylist, TimeOnly.MinValue, TimeOnly.MinValue);
        resultTooSmall.Error.Should().Be(Error.PlaylistEntryDurationTooSmall);

        resultTooSmall = PlaylistEntry.Create(validSong, validPlaylist,
            TimeOnly.FromTimeSpan(TimeSpan.FromMilliseconds(51000)),
            TimeOnly.FromTimeSpan(TimeSpan.FromMilliseconds(51999)));
        resultTooSmall.Error.Should().Be(Error.PlaylistEntryDurationTooSmall);


        // testing Domain breaching mutation

        validPlaylistEntry.SetStart(TimeOnly.FromTimeSpan(songDuration.ToTimeSpan() - TimeSpan.FromMilliseconds(999)))
            .Error.Should().Be(Error.PlaylistEntryDurationTooSmall);

        validPlaylistEntry.SetEnd(TimeOnly.FromTimeSpan(TimeSpan.FromMilliseconds(999)))
            .Error.Should().Be(Error.PlaylistEntryDurationTooSmall);
    }

    [Fact]
    public void Check_Should_ReturnError_When_EndBeforeStart()
    {
        // testing Domain breaching creation

        var resultEndBeforeStart = PlaylistEntry.Create(validSong, validPlaylist, TimeOnly.MaxValue, TimeOnly.MinValue);
        resultEndBeforeStart.Error.Should().Be(Error.PlaylistEntryEndBeforeStart);

        resultEndBeforeStart = PlaylistEntry.Create(validSong, validPlaylist,
            TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(52)),
            TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(51)));
        resultEndBeforeStart.Error.Should().Be(Error.PlaylistEntryEndBeforeStart);


        // testing Domain breaching mutation

        var resultValidPlaylistEntry = PlaylistEntry.Create(validSong, validPlaylist,
            TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(51)),
            TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(52)));
        resultValidPlaylistEntry.HasSucceeded.Should().BeTrue();
        resultValidPlaylistEntry.Value.Should().NotBeNull();
        var validPlaylistEntry = resultValidPlaylistEntry.Value;

        validPlaylistEntry.SetStart(TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(53)))
            .Error.Should().Be(Error.PlaylistEntryEndBeforeStart);

        validPlaylistEntry.SetEnd(TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(50)))
            .Error.Should().Be(Error.PlaylistEntryEndBeforeStart);
    }

    [Fact]
    public void Check_Should_NotReturnError_When_CommentEmpty()
    {
        // testing creation

        validPlaylistEntry.GetComment().Should().BeNull(); // when description not provided

        var resultPlaylistEntry = PlaylistEntry.Create(validSong, validPlaylist, TimeOnly.MinValue, songDuration, string.Empty); // when string.Empty provided
        resultPlaylistEntry.HasSucceeded.Should().BeTrue();
        resultPlaylistEntry.Value.Should().NotBeNull();
        var playlistEntry = resultPlaylistEntry.Value;
        playlistEntry.GetComment().Should().BeNull();
        playlistEntry.GetSong().Id.Should().Be(validSong.Id);
        playlistEntry.GetDuration().Should().Be(songDuration.ToTimeSpan());

        resultPlaylistEntry = PlaylistEntry.Create(validSong, validPlaylist, TimeOnly.MinValue, songDuration, ""); // when "" provided
        resultPlaylistEntry.HasSucceeded.Should().BeTrue();
        resultPlaylistEntry.Value.Should().NotBeNull();
        playlistEntry = resultPlaylistEntry.Value;
        playlistEntry.GetComment().Should().BeNull();
        playlistEntry.GetSong().Id.Should().Be(validSong.Id);
        playlistEntry.GetDuration().Should().Be(songDuration.ToTimeSpan());


        // testing mutation

        playlistEntry.SetComment("example comment");
        playlistEntry.GetComment().Should().Be("example comment");
        playlistEntry.SetComment(null);
        playlistEntry.GetComment().Should().BeNull();
        playlistEntry.SetComment("example comment 2");
        playlistEntry.GetComment().Should().Be("example comment 2");
        playlistEntry.SetComment(string.Empty);
        playlistEntry.GetComment().Should().BeNull();
        playlistEntry.SetComment("example comment 3");
        playlistEntry.GetComment().Should().Be("example comment 3");
        playlistEntry.SetComment("");
        playlistEntry.GetComment().Should().BeNull();
    }

    [Fact]
    public void Check_Should_NotReturnError_When_InsideDomain()
    {
        var resultLongestSong = Song.Create("artist", "title", TimeOnly.MaxValue, 128);
        resultLongestSong.HasSucceeded.Should().BeTrue();
        resultLongestSong.Value.Should().NotBeNull();
        var longestSong = resultLongestSong.Value;

        var resultLongestPlaylistEntry = PlaylistEntry.Create(longestSong, validPlaylist,
            TimeOnly.MinValue, TimeOnly.MaxValue, "example comment", Color.BlueViolet);
        resultLongestPlaylistEntry.HasSucceeded.Should().BeTrue();
        resultLongestPlaylistEntry.Value.Should().NotBeNull();
        var validPlaylistEntry = resultLongestPlaylistEntry.Value;

        // PlaylistEntry should reflect the referenced Song's changes
        longestSong.SetArtist("newArtist").HasSucceeded.Should().BeTrue();
        validPlaylistEntry.GetSong().GetArtist().Should().Be("newArtist");

        validPlaylistEntry.GetNr().Should().Be(0U); // default invalid nr, as Playlist would validate it later...
        
        // testing inside domain mutation
        validPlaylistEntry.SetStart(TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(62)));
        validPlaylistEntry.GetStart().Should().Be(TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(62)));
        validPlaylistEntry.SetEnd(TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(63)));
        validPlaylistEntry.GetEnd().Should().Be(TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(63)));
        validPlaylistEntry.SetColour(Color.DarkBlue);
        validPlaylistEntry.GetColour().Should().Be(Color.DarkBlue);
    }

    /* some more intricate tests with attributes more concerned with calculation logic */

    [Fact]
    public void Check_Should_NotReturnError_When_BpmChangeInDomain()
    {
        // testing the valid endpoints of bpmChange
        var pE = validPlaylistEntry;
        
        decimal lowestDecrease = -validSong.GetBpm();
        decimal highestIncrease = 300M - validSong.GetBpm();
        
        // testing just-in-bounds creation

        var resultLowestDecreasedEntry = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev(),
            lowestDecrease);
        resultLowestDecreasedEntry.HasSucceeded.Should().BeTrue();

        var resultHighestIncreasedEntry = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev(),
            highestIncrease);
        resultHighestIncreasedEntry.HasSucceeded.Should().BeTrue();

        // testing just-in-bounds mutation
        
        var unmutatedPE = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev());
        var resultLowestDecreaseMutation = unmutatedPE.Value!.SetBpmChange(lowestDecrease);
        resultLowestDecreaseMutation.HasSucceeded.Should().BeTrue();

        var resultHighestIncreaseMutation = unmutatedPE.Value!.SetBpmChange(highestIncrease);
        resultLowestDecreaseMutation.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public void Check_Should_ReturnError_When_BpmChangeOutsideDomain()
    {
        // testing the valid endpoints of bpmChange
        var pE = validPlaylistEntry;

        decimal overDecrease = -validSong.GetBpm() - 1;
        decimal overIncrease = 300M - validSong.GetBpm() + 1;

        // testing just-out-of-bounds creation

        var resultOverDecreasedEntry = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev(),
            overDecrease);
        resultOverDecreasedEntry.Error.Should().Be(Error.PlaylistEntryBpmDomainError);

        var resulOverIncreasedEntry = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev(),
            overIncrease);
        resulOverIncreasedEntry.Error.Should().Be(Error.PlaylistEntryBpmDomainError);

        // testing just-out-of-bounds mutation
        var unmutatedPE = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev());
        var resultOverDecreaseMutation = unmutatedPE.Value!.SetBpmChange(overDecrease);
        resultOverDecreaseMutation.Error.Should().Be(Error.PlaylistEntryBpmDomainError);

        var resulOverIncreaseMutation = unmutatedPE.Value!.SetBpmChange(overIncrease);
        resulOverIncreaseMutation.Error.Should().Be(Error.PlaylistEntryBpmDomainError);
    }

    [Fact]
    public void Check_Should_NotReturnError_When_BpmDoubledAndReset()
    {
        var pE = validPlaylistEntry;
        var resultTestPE = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev());
        resultTestPE.HasSucceeded.Should().BeTrue();
        var testPE = resultTestPE.Value!;

        for (int i = 0; i < 20; ++i)
        {
            bool changeCorrect = false;
            if (i % 2 == 0)
            {
                var bpmBefore = testPE.GetTrueBpm();
                var durationBefore = testPE.GetDuration();
                var bpmChange = (bpmBefore * 2) - bpmBefore;
                testPE.SetBpmChange(bpmChange);
                testPE.GetTrueBpm().Should().Be(bpmBefore * 2);
                var durationAfter = testPE.GetDuration();
                changeCorrect = Math.Round((decimal)durationBefore.Ticks / durationAfter.Ticks) == 2M;
            }
            else
            {
                var bpmBefore = testPE.GetTrueBpm();
                var durationBefore = testPE.GetDuration();
                var bpmChange = pE.GetBpmChange();
                testPE.SetBpmChange(bpmChange);
                testPE.GetTrueBpm().Should().Be(bpmBefore / 2);
                var durationAfter = testPE.GetDuration();
                changeCorrect = Math.Round((decimal)durationAfter.Ticks / durationBefore.Ticks) == 2M;
            }
            changeCorrect.Should().BeTrue();
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_When_ChangingBpmInMagnitudes()
    {
        var pE = validPlaylistEntry;
        var resultTestPE = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart().AddMinutes(1), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, pE.GetNr(), pE.GetWithPrev());
        resultTestPE.HasSucceeded.Should().BeTrue();
        var testPE = resultTestPE.Value!;

        decimal[] changeMagnitudes = { 1/8M, 1/6M, 1/4M, 1/3M, 1/2M,
                                       3/2M, 4/3M, 5/3M, 2/1M, 7/3M };

        foreach (var changeMagnitude in changeMagnitudes)
        {
            var bpmBefore = testPE.GetTrueBpm();
            var durationBefore = testPE.GetDuration();
            var bpmChange = (changeMagnitude * bpmBefore) - bpmBefore;
            testPE.SetBpmChange(bpmChange);
            testPE.GetTrueBpm().Should().BeApproximately(bpmBefore * changeMagnitude, 4);
            var durationAfter = testPE.GetDuration();
            var expectedRate = Math.Round(1M / changeMagnitude, 4);
            var changedRate = Math.Round((decimal)durationAfter.Ticks / durationBefore.Ticks, 4);
            (expectedRate == changedRate).Should().BeTrue();
            
            testPE.SetBpmChange(0);
            testPE.GetTrueBpm().Should().Be(pE.GetTrueBpm());
        }
    }

    [Fact]
    public void Check_Should_NotReturnError_When_WithPrevSet()
    {
        var pE = validPlaylistEntry;
        
        // testing valid creation

        var resultTestPE_default = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id);
        resultTestPE_default.HasSucceeded.Should().BeTrue();

        var resultTestPE_1 = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, 1U, false);
        resultTestPE_1.HasSucceeded.Should().BeTrue();

        var resultTestPE_2 = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, 2U, true);
        resultTestPE_2.HasSucceeded.Should().BeTrue();

        // testing valid mutation

        var testPE_2 = resultTestPE_2.Value!;
        testPE_2.SetWithPrev(false).HasSucceeded.Should().BeTrue();
        testPE_2.GetWithPrev().Should().BeFalse();
        testPE_2.SetWithPrev(true).HasSucceeded.Should().BeTrue();
        testPE_2.GetWithPrev().Should().BeTrue();
    }

    [Fact]
    public void Check_Should_ReturnError_When_FirstWithPrevSet()
    {
        var pE = validPlaylistEntry;
        
        // testing invalid creation

        var resultInvalidFirstMaster = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, 1U, true);
        resultInvalidFirstMaster.Error.Should().Be(Error.PlaylistEntryFirstNotMaster);

        // testing invalid mutation

        var resultTestPE_1 = PlaylistEntry.Create(validSong, pE.GetParentPlaylist(),
            pE.GetStart(), pE.GetEnd(), pE.GetComment(), pE.GetColour(), pE.Id, 1U, false);
        resultTestPE_1.HasSucceeded.Should().BeTrue();
        var testPE_1 = resultTestPE_1.Value!;
        testPE_1.SetWithPrev(true).Error.Should().Be(Error.PlaylistEntryFirstNotMaster);
    }
}
