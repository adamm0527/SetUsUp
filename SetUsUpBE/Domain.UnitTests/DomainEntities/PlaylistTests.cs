using FluentAssertions;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Domain.Primitives;

namespace Domain.UnitTests.DomainEntities;

public sealed class PlaylistTests
{
    readonly Group validGroup;
    readonly Playlist validPlaylist;
    readonly Playlist livingPlaylist;

    readonly TimeOnly dur1, dur2, dur3, dur4;
    readonly Song song1, song2, song3, song4;
    readonly PlaylistEntry entry1, entry2, entry3, entry4, entry5;
    
    public PlaylistTests()
    {
        var resultGroup = Group.Create(true, "group");
        resultGroup.HasSucceeded.Should().BeTrue();
        resultGroup.Value.Should().NotBeNull();
        validGroup = resultGroup.Value;

        var resultPlaylist = Playlist.Create(validGroup, "playlist");
        resultPlaylist.HasSucceeded.Should().BeTrue();
        resultPlaylist.Value.Should().NotBeNull();
        validPlaylist = resultPlaylist.Value;

        resultPlaylist = Playlist.Create(validGroup, "livingPlaylist");
        resultPlaylist.HasSucceeded.Should().BeTrue();
        resultPlaylist.Value.Should().NotBeNull();
        livingPlaylist = resultPlaylist.Value;


        dur1 = TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(120));
        dur2 = TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(168));
        dur3 = TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(440));
        dur4 = TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(360));

        var resultSong = Song.Create("artist1", "title1", dur1, 128, 128, "2A");
        resultSong.HasSucceeded.Should().BeTrue();
        resultSong.Value.Should().NotBeNull();
        song1 = resultSong.Value;

        resultSong = Song.Create("artist2", "title2", dur2, 130, 130, "2B");
        resultSong.HasSucceeded.Should().BeTrue();
        resultSong.Value.Should().NotBeNull();
        song2 = resultSong.Value;

        resultSong = Song.Create("artist3", "title3", dur3, 130, 132, "4B");
        resultSong.HasSucceeded.Should().BeTrue();
        resultSong.Value.Should().NotBeNull();
        song3 = resultSong.Value;

        resultSong = Song.Create("artist3", "title3", dur4, 132, 132, "4A");
        resultSong.HasSucceeded.Should().BeTrue();
        resultSong.Value.Should().NotBeNull();
        song4 = resultSong.Value;


        var resultEntry = PlaylistEntry.Create(song1, livingPlaylist, TimeOnly.MinValue, dur1);
        resultEntry.HasSucceeded.Should().BeTrue();
        resultEntry.Value.Should().NotBeNull();
        entry1 = resultEntry.Value;

        resultEntry = PlaylistEntry.Create(song2, livingPlaylist, TimeOnly.MinValue, dur2);
        resultEntry.HasSucceeded.Should().BeTrue();
        resultEntry.Value.Should().NotBeNull();
        entry2 = resultEntry.Value;

        resultEntry = PlaylistEntry.Create(song3, livingPlaylist, TimeOnly.MinValue, dur3);
        resultEntry.HasSucceeded.Should().BeTrue();
        resultEntry.Value.Should().NotBeNull();
        entry3 = resultEntry.Value;

        resultEntry = PlaylistEntry.Create(song4, livingPlaylist, TimeOnly.MinValue, dur4);
        resultEntry.HasSucceeded.Should().BeTrue();
        resultEntry.Value.Should().NotBeNull();
        entry4 = resultEntry.Value;

        resultEntry = PlaylistEntry.Create(song4, livingPlaylist, 
            TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(20)),
            TimeOnly.FromTimeSpan(dur4.ToTimeSpan() - TimeSpan.FromSeconds(20)));
        resultEntry.HasSucceeded.Should().BeTrue();
        resultEntry.Value.Should().NotBeNull();
        entry5 = resultEntry.Value;
    }

    [Fact]
    public void Check_Should_ReturnError_When_NameEmpty()
    {
        // testing Domain breaching creation

        var resultPlaylist = Playlist.Create(validGroup, null!);
        resultPlaylist.Error.Should().Be(Error.PlaylistNameEmpty);

        resultPlaylist = Playlist.Create(validGroup, string.Empty);
        resultPlaylist.Error.Should().Be(Error.PlaylistNameEmpty);

        resultPlaylist = Playlist.Create(validGroup, "");
        resultPlaylist.Error.Should().Be(Error.PlaylistNameEmpty);


        // testing Domain breaching mutation

        validPlaylist.SetName(null!).Error.Should().Be(Error.PlaylistNameEmpty);
        validPlaylist.SetName(string.Empty).Error.Should().Be(Error.PlaylistNameEmpty);
        validPlaylist.SetName("").Error.Should().Be(Error.PlaylistNameEmpty);
    }

    [Fact]
    public void Check_Should_ReturnError_When_AddingDuplicateEntry()
    {
        var addResult = livingPlaylist.AddEntryAt(entry1);
        addResult.HasSucceeded.Should().BeTrue();
        addResult.Value.Should().NotBeNull();

        livingPlaylist.AddEntryAt(entry1).Error
            .Should().Be(Error.PlaylistNewEntryDuplicate);
    }

    [Fact]
    public void Check_Should_ReturnError_When_EntryParentMismatch()
    {
        entry1.GetParentPlaylist().Id.Should().Be(livingPlaylist.Id);
        // parent of entry1 is livingPlaylist (set in constructor)
        
        validPlaylist.AddEntryAt(entry1)
            .Error.Should().Be(Error.PlaylistNewEntryParentMismatch);
    }

    [Fact]
    public void Check_Should_NotReturnError_When_DescriptionEmpty()
    {
        // testing creation

        validPlaylist.GetDescription().Should().BeNull(); // when description not provided

        var resultPlaylist = Playlist.Create(validGroup, "playlist", string.Empty); // when string.Empty provided
        resultPlaylist.HasSucceeded.Should().BeTrue();
        resultPlaylist.Value.Should().NotBeNull();
        var playlist = resultPlaylist.Value;
        playlist.GetName().Should().Be("playlist");
        playlist.GetDescription().Should().BeNull();
        playlist.GetDuration().Should().Be(TimeSpan.Zero);
        playlist.GetEntriesCount().Should().Be(0);

        resultPlaylist = Playlist.Create(validGroup, "playlist2", ""); // when "" provided
        resultPlaylist.HasSucceeded.Should().BeTrue();
        resultPlaylist.Value.Should().NotBeNull();
        playlist = resultPlaylist.Value;
        playlist.GetName().Should().Be("playlist2");
        playlist.GetDescription().Should().BeNull();
        playlist.GetDuration().Should().Be(TimeSpan.Zero);
        playlist.GetEntriesCount().Should().Be(0);


        // testing mutation

        playlist.SetName("playlist3").HasSucceeded.Should().BeTrue();
        playlist.GetName().Should().Be("playlist3");

        playlist.SetDescription("description1");
        playlist.GetDescription().Should().Be("description1");
        playlist.SetDescription(null);
        playlist.GetDescription().Should().BeNull();
        playlist.SetDescription("description2");
        playlist.GetDescription().Should().Be("description2");
        playlist.SetDescription(string.Empty);
        playlist.GetDescription().Should().BeNull();
        playlist.SetDescription("description3");
        playlist.GetDescription().Should().Be("description3");
        playlist.SetDescription("");
        playlist.GetDescription().Should().BeNull();

        // Playlist should reflect the referenced Group's changes
        validGroup.SetName("newGroup");
        validPlaylist.GetOwnerGroup().GetName().Should().Be("newGroup");
        playlist.GetOwnerGroup().GetName().Should().Be("newGroup");
    }

    [Fact]
    public void Check_Should_NotReturnError_When_AddingEntries()
    {
        Add_Entries_();
    }

    [Fact]
    public void Check_Should_NotReturnError_When_MovingEntries()
    {
        Add_Entries_(); // entry order: 3, 1, 5, 2, 4
        var duration = livingPlaylist.GetDuration(); // duration should not change when moving

        // testing cases when order should not change
        livingPlaylist.MoveEntry(-1, 3); // underflowing index (non-existent entry)
        livingPlaylist[0].Id.Should().Be(entry3.Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[2].Id.Should().Be(entry5.Id);
        livingPlaylist[3].Id.Should().Be(entry2.Id);
        livingPlaylist[4].Id.Should().Be(entry4.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);
        livingPlaylist.MoveEntry(4, 4); // moved to the same place
        livingPlaylist[0].Id.Should().Be(entry3.Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[2].Id.Should().Be(entry5.Id);
        livingPlaylist[3].Id.Should().Be(entry2.Id);
        livingPlaylist[4].Id.Should().Be(entry4.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);
        livingPlaylist.MoveEntry(5, 0); // overflowing index (non-existent entry)
        livingPlaylist[0].Id.Should().Be(entry3.Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[2].Id.Should().Be(entry5.Id);
        livingPlaylist[3].Id.Should().Be(entry2.Id);
        livingPlaylist[4].Id.Should().Be(entry4.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);

        // moving from start to end
        livingPlaylist.MoveEntry(0, livingPlaylist.GetEntriesCount() - 1);
        livingPlaylist[0].Id.Should().Be(entry1.Id);
        livingPlaylist[1].Id.Should().Be(entry5.Id);
        livingPlaylist[2].Id.Should().Be(entry2.Id);
        livingPlaylist[3].Id.Should().Be(entry4.Id);
        livingPlaylist[4].Id.Should().Be(entry3.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);

        // moving from start to middle
        livingPlaylist.MoveEntry(0, 2);
        livingPlaylist[0].Id.Should().Be(entry5.Id);
        livingPlaylist[1].Id.Should().Be(entry2.Id);
        livingPlaylist[2].Id.Should().Be(entry1.Id);
        livingPlaylist[3].Id.Should().Be(entry4.Id);
        livingPlaylist[4].Id.Should().Be(entry3.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);

        // moving from middle to middle
        livingPlaylist.MoveEntry(1, 3);
        livingPlaylist[0].Id.Should().Be(entry5.Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[2].Id.Should().Be(entry4.Id);
        livingPlaylist[3].Id.Should().Be(entry2.Id);
        livingPlaylist[4].Id.Should().Be(entry3.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);

        // moving from middle to start
        livingPlaylist.MoveEntry(2, -1); // even with underflowing destIdx
        livingPlaylist[0].Id.Should().Be(entry4.Id);
        livingPlaylist[1].Id.Should().Be(entry5.Id);
        livingPlaylist[2].Id.Should().Be(entry1.Id);
        livingPlaylist[3].Id.Should().Be(entry2.Id);
        livingPlaylist[4].Id.Should().Be(entry3.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);

        // moving from middle to end
        livingPlaylist.MoveEntry(1, livingPlaylist.GetEntriesCount()); // even with overflowing destIdx
        livingPlaylist[0].Id.Should().Be(entry4.Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[2].Id.Should().Be(entry2.Id);
        livingPlaylist[3].Id.Should().Be(entry3.Id);
        livingPlaylist[4].Id.Should().Be(entry5.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);

        // moving from end to start
        livingPlaylist.MoveEntry(livingPlaylist.GetEntriesCount() - 1, 0);
        livingPlaylist[0].Id.Should().Be(entry5.Id);
        livingPlaylist[1].Id.Should().Be(entry4.Id);
        livingPlaylist[2].Id.Should().Be(entry1.Id);
        livingPlaylist[3].Id.Should().Be(entry2.Id);
        livingPlaylist[4].Id.Should().Be(entry3.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);

        // moving from end to middle
        livingPlaylist.MoveEntry(livingPlaylist.GetEntriesCount() - 1, 2);
        livingPlaylist[0].Id.Should().Be(entry5.Id);
        livingPlaylist[1].Id.Should().Be(entry4.Id);
        livingPlaylist[2].Id.Should().Be(entry3.Id);
        livingPlaylist[3].Id.Should().Be(entry1.Id);
        livingPlaylist[4].Id.Should().Be(entry2.Id);
        Check_PlaylistOrder_();
        livingPlaylist.GetDuration().Should().Be(duration);
    }

    [Fact]
    public void Check_Should_NotReturnError_When_ModifyingEntries()
    {
        livingPlaylist.ClearEntries();
        livingPlaylist.AddEntryAt(entry1);
        livingPlaylist.AddEntryAt(entry2);
        livingPlaylist.AddEntryAt(entry3);
        livingPlaylist.AddEntryAt(entry4);
        livingPlaylist.AddEntryAt(entry5);
        var dur = livingPlaylist.GetDuration();
        dur.Should().Be(entry1.GetDuration() + entry2.GetDuration() + entry3.GetDuration() + entry4.GetDuration() + entry5.GetDuration());

        // when an entry's duration is decreased by 1 second, the whole playlist's duration should also decrease by 1 second automatically
        entry1.SetEnd(TimeOnly.FromTimeSpan(entry1.GetEnd() - TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(1))));
        livingPlaylist.GetDuration().Should().Be(dur - TimeSpan.FromSeconds(1));
        dur -= TimeSpan.FromSeconds(1);

        // when an entry's duration is decreased by 2 seconds, the whole playlist's duration should also decrease by 2 seconds automatically
        entry3.SetStart(entry3.GetStart().Add(TimeSpan.FromSeconds(2)));
        livingPlaylist.GetDuration().Should().Be(dur - TimeSpan.FromSeconds(2));
        dur -= TimeSpan.FromSeconds(2);

        // when an entry's duration is increased by 20 seconds, the whole playlist's duration should also increase by 20 seconds automatically
        entry5.SetStart(TimeOnly.FromTimeSpan(entry5.GetStart() - TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(20))));
        livingPlaylist.GetDuration().Should().Be(dur + TimeSpan.FromSeconds(20));
        dur += TimeSpan.FromSeconds(20);

        // when an entry's tempo is changed, it's duration should automatically changed, and also be reflected in the Playlist's duration
        var ogEntry2Dur = entry2.GetDuration();
        entry2.SetBpmChange(song2.GetBpm());
        var newEntry2Dur = entry2.GetDuration();
        ogEntry2Dur.Should().Be(2 * newEntry2Dur);
        var entryDurDiff = ogEntry2Dur - newEntry2Dur;
        livingPlaylist.GetDuration().Should().Be(dur - entryDurDiff);
        dur -= entryDurDiff;
    }

    [Fact]
    public void Check_Should_NotReturnError_When_DeletingEntries()
    {
        Add_Entries_(); // entry order: 3, 1, 5, 2, 4
        var cmpDuration = livingPlaylist.GetDuration();

        // testing invalid indices (nothing should happen)
        livingPlaylist.RemoveEntryAt(-1); // checking underflowing index
        livingPlaylist.GetEntriesCount().Should().Be(5);
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        Check_PlaylistOrder_();
        livingPlaylist.RemoveEntryAt(5); // checking overflowing index
        livingPlaylist.GetEntriesCount().Should().Be(5);
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        Check_PlaylistOrder_();

        // removing from front
        livingPlaylist.RemoveEntryAt(0);
        livingPlaylist.GetEntriesCount().Should().Be(4);
        cmpDuration -= entry3.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        Check_PlaylistOrder_();

        // removing from back
        livingPlaylist.RemoveEntryAt(livingPlaylist.GetEntriesCount() - 1);
        livingPlaylist.GetEntriesCount().Should().Be(3);
        cmpDuration -= entry4.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        Check_PlaylistOrder_();

        // removing from middle
        livingPlaylist.RemoveEntryAt(1);
        livingPlaylist.GetEntriesCount().Should().Be(2);
        cmpDuration -= entry5.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        Check_PlaylistOrder_();

        // removing from back again
        livingPlaylist.RemoveEntryAt(livingPlaylist.GetEntriesCount() - 1);
        livingPlaylist.GetEntriesCount().Should().Be(1);
        cmpDuration -= entry2.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        Check_PlaylistOrder_();

        // removing last item
        livingPlaylist.RemoveEntryAt(0);
        livingPlaylist.GetEntriesCount().Should().Be(0);
        cmpDuration -= entry1.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        livingPlaylist.GetDuration().Should().Be(TimeSpan.Zero);
        Check_PlaylistOrder_();
    }

    [Fact]
    public void Check_Should_NotReturnError_When_ClearingEntries()
    {
        Add_Entries_();
        livingPlaylist.ClearEntries();
        livingPlaylist.GetEntriesCount().Should().Be(0);
        livingPlaylist.GetDuration().Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public void Check_Should_NotReturnError_When_UpdatingTransitions()
    {
        var resultPlaylist = Playlist.Create(validGroup, "key testing playlist");
        resultPlaylist.HasSucceeded.Should().BeTrue();
        resultPlaylist.Value.Should().NotBeNull();
        var p = resultPlaylist.Value;

        p.AddEntryAt(CreateEntry_("3A", p)); // 3A
        p[0].GetTransitionToNext().Should().BeNull();

        p.AddEntryAt(CreateEntry_("4A", p)); // 3A, [4A]
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X"); // Boost after insert
        p[1].GetTransitionToNext().Should().BeNull();

        p.AddEntryAt(CreateEntry_("3B", p)); // 3A, 4A, [3B]
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("-1C"); // DiagonalMinorDown after insert
        p[2].GetTransitionToNext().Should().BeNull();

        p.AddEntryAt(CreateEntry_("5B", p), 2); // 3A, 4A, [5B], 3B
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("+1c"); // DiagonalAtonalMinorUp
        p[2].GetTransitionToNext()!.Value.Should().Be("-2X"); // EnergyDropBig after insert
        p[3].GetTransitionToNext().Should().BeNull();

        p.AddEntryAt(CreateEntry_("10B", p)); // 3A, 4A, 5B, 3B, [10B]
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("+1c");
        p[2].GetTransitionToNext()!.Value.Should().Be("-2X");
        p[3].GetTransitionToNext()!.Value.Should().Be("+7X"); // EnergyBoost after insert
        p[4].GetTransitionToNext().Should().BeNull();

        p.MoveEntry(4, 3); // swapping last two entries: 3A, 4A, 5B, [10B], 3B
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("+1c");
        p[2].GetTransitionToNext()!.Value.Should().Be("DIF"); // +5X is not a MixVariant
        p[3].GetTransitionToNext()!.Value.Should().Be("-7X"); // EnergyDrop after move
        p[4].GetTransitionToNext().Should().BeNull();

        p.AddEntryAt(CreateEntry_(null, p), 3); // inserting unknown key entry: 3A, 4A, 5B, [???], 10B, 3B
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("+1c");
        p[2].GetTransitionToNext().Should().BeNull();
        p[3].GetTransitionToNext().Should().BeNull();
        p[4].GetTransitionToNext()!.Value.Should().Be("-7X"); // EnergyDrop after move
        p[5].GetTransitionToNext().Should().BeNull();

        p.AddEntryAt(CreateEntry_(null, p), 3); // inserting unknown key entry: 3A, 4A, 5B, [???], ???, 10B, 3B
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("+1c");
        p[2].GetTransitionToNext().Should().BeNull();
        p[3].GetTransitionToNext().Should().BeNull();
        p[4].GetTransitionToNext().Should().BeNull();
        p[5].GetTransitionToNext()!.Value.Should().Be("-7X"); // EnergyDrop after move
        p[6].GetTransitionToNext().Should().BeNull();

        p.RemoveEntryAt(3);
        p.RemoveEntryAt(3); // after removing the unknown key entries: 3A, 4A, 5B, 10B, 3B
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("+1c");
        p[2].GetTransitionToNext()!.Value.Should().Be("DIF");
        p[3].GetTransitionToNext()!.Value.Should().Be("-7X");
        p[4].GetTransitionToNext().Should().BeNull();

        p.AddEntryAt(CreateEntry_(null, p), 0); // inserting unknown key at front: [???], 3A, 4A, 5B, 10B, 3B
        p[0].GetTransitionToNext().Should().BeNull();
        p[1].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[2].GetTransitionToNext()!.Value.Should().Be("+1c");
        p[3].GetTransitionToNext()!.Value.Should().Be("DIF");
        p[4].GetTransitionToNext()!.Value.Should().Be("-7X");
        p[5].GetTransitionToNext().Should().BeNull();

        p.MoveEntry(0, 4); // moving unknown key: 3A, 4A, 5B, 10B, [???], 3B
        p[0].GetTransitionToNext()!.Value.Should().Be("+1X");
        p[1].GetTransitionToNext()!.Value.Should().Be("+1c");
        p[2].GetTransitionToNext()!.Value.Should().Be("DIF");
        p[3].GetTransitionToNext().Should().BeNull();
        p[4].GetTransitionToNext().Should().BeNull();
        p[5].GetTransitionToNext().Should().BeNull();
    }

    private void Add_Entries_()
    {
        var cmpDuration = TimeSpan.Zero;
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        livingPlaylist.GetEntriesCount().Should().Be(0);

        // inserting to end (implicitly)
        livingPlaylist.AddEntryAt(entry1);
        // validating items
        livingPlaylist[0].Id.Should().Be(entry1.Id);
        livingPlaylist[0].GetSong().Id.Should().Be(entry1.GetSong().Id);
        // validating duration
        cmpDuration += entry1.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        // validating numbers
        livingPlaylist[0].GetNr().Should().Be(1);
        livingPlaylist.GetEntriesCount().Should().Be(1);


        // inserting to end (by providing negative index)
        livingPlaylist.AddEntryAt(entry2, -2);
        // validating items
        livingPlaylist[0].Id.Should().Be(entry1.Id);
        livingPlaylist[0].GetSong().Id.Should().Be(entry1.GetSong().Id);
        livingPlaylist[1].Id.Should().Be(entry2.Id);
        livingPlaylist[1].GetSong().Id.Should().Be(entry2.GetSong().Id);
        // validating duration
        cmpDuration += entry2.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        // validating numbers
        livingPlaylist[0].GetNr().Should().Be(1);
        livingPlaylist[1].GetNr().Should().Be(2);
        livingPlaylist.GetEntriesCount().Should().Be(2);


        // inserting to front (by providing 0 index)
        livingPlaylist.AddEntryAt(entry3, 0);
        // validating items
        livingPlaylist[0].Id.Should().Be(entry3.Id);
        livingPlaylist[0].GetSong().Id.Should().Be(entry3.GetSong().Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[1].GetSong().Id.Should().Be(entry1.GetSong().Id);
        livingPlaylist[2].Id.Should().Be(entry2.Id);
        livingPlaylist[2].GetSong().Id.Should().Be(entry2.GetSong().Id);
        // validating duration
        cmpDuration += entry3.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        // validating numbers
        livingPlaylist.GetEntriesCount().Should().Be(3);
        Check_PlaylistOrder_();


        // inserting to end (by providing overflowing index)
        livingPlaylist.AddEntryAt(entry4, int.MaxValue);
        // validating items
        livingPlaylist[0].Id.Should().Be(entry3.Id);
        livingPlaylist[0].GetSong().Id.Should().Be(entry3.GetSong().Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[1].GetSong().Id.Should().Be(entry1.GetSong().Id);
        livingPlaylist[2].Id.Should().Be(entry2.Id);
        livingPlaylist[2].GetSong().Id.Should().Be(entry2.GetSong().Id);
        livingPlaylist[3].Id.Should().Be(entry4.Id);
        livingPlaylist[3].GetSong().Id.Should().Be(entry4.GetSong().Id);
        // validating duration
        cmpDuration += entry4.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        // validating numbers
        livingPlaylist.GetEntriesCount().Should().Be(4);
        Check_PlaylistOrder_();


        // inserting in the middle
        livingPlaylist.AddEntryAt(entry5, 2);
        // validating items
        livingPlaylist[0].Id.Should().Be(entry3.Id);
        livingPlaylist[0].GetSong().Id.Should().Be(entry3.GetSong().Id);
        livingPlaylist[1].Id.Should().Be(entry1.Id);
        livingPlaylist[1].GetSong().Id.Should().Be(entry1.GetSong().Id);
        livingPlaylist[2].Id.Should().Be(entry5.Id);
        livingPlaylist[2].GetSong().Id.Should().Be(entry5.GetSong().Id);
        livingPlaylist[3].Id.Should().Be(entry2.Id);
        livingPlaylist[3].GetSong().Id.Should().Be(entry2.GetSong().Id);
        livingPlaylist[4].Id.Should().Be(entry4.Id);
        livingPlaylist[4].GetSong().Id.Should().Be(entry4.GetSong().Id);
        // validating that entry4 and entry5 reference the same song
        livingPlaylist[2].GetSong().Id.Should().Be(livingPlaylist[4].GetSong().Id);
        // validating duration
        cmpDuration += entry5.GetDuration();
        livingPlaylist.GetDuration().Should().Be(cmpDuration);
        // validating numbers
        livingPlaylist.GetEntriesCount().Should().Be(5);
        Check_PlaylistOrder_();
    }

    private void Check_PlaylistOrder_()
    {
        for (uint i = 0U; i < livingPlaylist.GetEntriesCount(); i++)
            livingPlaylist[(int)i].GetNr().Should().Be(i + 1);
    }

    private PlaylistEntry CreateEntry_(string? initKey, Playlist parent)
    {
        var resultSong = Song.Create("artist", "title", dur1, 128, 128, initKey);
        resultSong.HasSucceeded.Should().BeTrue();
        resultSong.Value.Should().NotBeNull();

        var resultEntry = PlaylistEntry.Create(resultSong.Value, parent, TimeOnly.MinValue, dur1);
        resultEntry.HasSucceeded.Should().BeTrue();
        resultEntry.Value.Should().NotBeNull();

        return resultEntry.Value;
    }
}
