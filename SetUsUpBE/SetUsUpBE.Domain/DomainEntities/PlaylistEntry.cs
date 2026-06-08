using System.Drawing;
using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.DomainEvents;
using SetUsUpBE.Domain.ValueObjects;

namespace SetUsUpBE.Domain.Entities;

public sealed class PlaylistEntry : Entity
{
    private readonly Song songRef; // the song the PlaylistEntry references
    private readonly Playlist parentPlaylist; // reference to the Playlist which contains this PlaylistEntry
    private uint nr; // validated inside container Playlist AggregateRoot (each 'nr' is unique in sequence)
    private MusicalKeyTransition? transitionToNext; // validated & consistency maintained inside Playlist AggregateRoot
    private TimeOnly start;
    private TimeOnly end;
    private decimal bpmChange; // if other than 0, the Song is either played faster or slower
    private bool withPrev; // if true, this song is supposed to be played at the same time as the previous
    private string? comment;
    private Color? colour;

    
    private PlaylistEntry(Song songRef, Playlist parentPlaylist, TimeOnly start, TimeOnly end,
        string? comment = null, Color? colour = null, Guid? id = null, uint nr = 0,
        bool withPrev = false, decimal bpmChange = 0)
    {
        this.songRef = songRef;
        this.parentPlaylist = parentPlaylist;
        this.nr = nr; // setting an invalid nr (the proper value is set when "Handle" is called with PlaylistOrderChanged DomainEvent)
        this.transitionToNext = null; // setting unknown MixVariant (same as above)
        this.start = start;
        this.end = end;
        this.bpmChange = bpmChange;
        this.withPrev = withPrev;
        this.comment = comment;
        this.colour = colour;
        

        if (comment is not null)
            this.comment = comment.Trim();
        
        if (id is not null)
            base.Id = (Guid)id;
    }

    public static Result<PlaylistEntry> Create(Song songRef, Playlist parentPlaylist, TimeOnly start, TimeOnly end,
        string? comment = null, Color? colour = null, Guid? id = null, uint nr = 0,
        bool withPrev = false, decimal bpmChange = 0)
    {
        // endpoint cannot be later than the duration of the referenced song
        var durationTooLongResult = CheckDurationTooLong_<PlaylistEntry>(songRef, end);
        if (durationTooLongResult.HasFailed)
            return durationTooLongResult;


        // end cannot be before start
        var endBeforeStartResult = CheckEndBeforeStart_<PlaylistEntry>(start, end);
        if (endBeforeStartResult.HasFailed)
            return endBeforeStartResult;


        // end - start must be at least 1 second
        // (TimeOnly.MaxValue - TimeOnly.MinValue is always less than 24 hours, no checking needed)
        var durationTooSmallResult = CheckDurationTooSmall_<PlaylistEntry>(start, end);
        if (durationTooSmallResult.HasFailed)
            return durationTooSmallResult;


        // even with BPM change, the resulting BPM cannot be outside the allowed domain
        var resultBpm = songRef.GetBpm() + bpmChange;
        var resultBpmInDomainResult = CheckBpmDomain_<PlaylistEntry>(resultBpm);
        if (resultBpmInDomainResult.HasFailed)
            return resultBpmInDomainResult;

        var resultBpmOut = songRef.GetBpmOut() + bpmChange;
        var resultBpmOutInDomainResult = CheckBpmDomain_<PlaylistEntry>(resultBpmOut);
        if (resultBpmOutInDomainResult.HasFailed)
            return resultBpmOutInDomainResult;


        // the very first entry in the playlist cannot be played with the previous
        var resultFirstMaster = CheckFirstMaster_<PlaylistEntry>(nr, withPrev);
        if (resultFirstMaster.HasFailed)
            return resultFirstMaster;

        Nullify_String_If_Empty_(ref comment);

        var resultPlaylistEntry = new PlaylistEntry(songRef, parentPlaylist, start, end, comment, colour, id, nr, withPrev, bpmChange);
        return Result<PlaylistEntry>.Success(resultPlaylistEntry);
    }

    public Song GetSong() => songRef;

    public Playlist GetParentPlaylist() => parentPlaylist;

    public uint GetNr() => nr;

    public MusicalKeyTransition? GetTransitionToNext() => transitionToNext;

    public TimeOnly GetStart() => start;
    public Result<TimeOnly> SetStart(TimeOnly start)
    {
        var durationTooSmallResult = CheckDurationTooSmall_<TimeOnly>(start, end);
        if (durationTooSmallResult.HasFailed)
            return durationTooSmallResult;

        var endBeforeStartResult = CheckEndBeforeStart_<TimeOnly>(start, end);
        if (endBeforeStartResult.HasFailed)
            return endBeforeStartResult;

        this.start = start;
        parentPlaylist.UpdateDuration();
        return Result<TimeOnly>.Success(start);
    }

    public TimeOnly GetEnd() => end;
    public Result<TimeOnly> SetEnd(TimeOnly end)
    {
        var durationTooLongResult = CheckDurationTooLong_<TimeOnly>(songRef, end);
        if (durationTooLongResult.HasFailed)
            return durationTooLongResult;

        var endBeforeStartResult = CheckEndBeforeStart_<TimeOnly>(start, end);
        if (endBeforeStartResult.HasFailed)
            return endBeforeStartResult;

        var durationTooSmallResult = CheckDurationTooSmall_<TimeOnly>(start, end);
        if (durationTooSmallResult.HasFailed)
            return durationTooSmallResult;

        this.end = end;
        parentPlaylist.UpdateDuration();
        return Result<TimeOnly>.Success(end);
    }

    public TimeSpan GetDuration()
    {
        decimal trueBpm = GetTrueBpm();
        if (trueBpm == 0)
            return (end - start);

        decimal changeRate = songRef.GetBpm() / trueBpm;
        decimal ticks = (end - start).Ticks;
        return TimeSpan.FromTicks(Convert.ToInt64(changeRate * ticks));
    }

    public string? GetComment() => comment;
    public void SetComment(string? comment)
    {
        Nullify_String_If_Empty_(ref comment);
        this.comment = comment;
        if (this.comment is not null)
            this.comment = this.comment.Trim();
    }

    public Color? GetColour() => colour;
    public void SetColour(Color? colour) => this.colour = colour;

    public decimal GetTrueBpm()
    {
        decimal songBpm = songRef.GetBpm();
        if (songBpm == 0)
            return 0;

        return songBpm + this.bpmChange;
    }

    public decimal GetBpmChange() => bpmChange;
    public Result<decimal> SetBpmChange(decimal changeBpm)
    {
        var resultBpm = songRef.GetBpm() + changeBpm;
        var resultBpmInDomainResult = CheckBpmDomain_<decimal>(resultBpm);
        if (resultBpmInDomainResult.HasFailed)
            return resultBpmInDomainResult;

        var resultBpmOut = songRef.GetBpm() + changeBpm;
        var resultBpmOutInDomainResult = CheckBpmDomain_<decimal>(resultBpmOut);
        if (resultBpmOutInDomainResult.HasFailed)
            return resultBpmOutInDomainResult;

        // successful tempo mutation
        this.bpmChange = changeBpm;
        parentPlaylist.UpdateDuration();
        return Result<decimal>.Success(resultBpm);
    }

    public bool GetWithPrev() => withPrev;
    public Result<bool> SetWithPrev(bool withPrev)
    {
        uint curr_nr = GetNr();
        var resultFirstMaster = CheckFirstMaster_<bool>(curr_nr, withPrev);
        if (resultFirstMaster.HasFailed)
            return resultFirstMaster;

        this.withPrev = withPrev;
        return Result<bool>.Success();
    }

    public void Handle(PlaylistOrderChanged orderChangedEvent, PlaylistEntry? nextEntry = null)
    {
        if (orderChangedEvent.Handled)
            return;

        nr = orderChangedEvent.GetNextNr(); // reassigning entry number

        // reassigning the transition MixVariant
        transitionToNext = (nextEntry is null)
            ? null
            : MusicalKeyTransition.Create(this.GetSong().GetInitKey(), nextEntry.GetSong().GetInitKey());
    }


    // Validation checks
    // The Create factory and the Setters both use these as invariants
    // (validation logic should only be modified here)
   
    private static Result<T> CheckDurationTooLong_<T>(Song song, TimeOnly end)
    {
        if (end > song.GetDuration())
            return Result<T>.Failure(Error.PlaylistEntryDurationTooLong);

        return Result<T>.Success();
    }

    private static Result<T> CheckDurationTooSmall_<T>(TimeOnly start, TimeOnly end)
    {
        var duration = end - start;
        if (duration < TimeSpan.FromSeconds(1))
            return Result<T>.Failure(Error.PlaylistEntryDurationTooSmall);

        return Result<T>.Success();
    }

    private static Result<T> CheckEndBeforeStart_<T>(TimeOnly start, TimeOnly end)
    {
        if (end < start)
            return Result<T>.Failure(Error.PlaylistEntryEndBeforeStart);

        return Result<T>.Success();
    }

    private static void Nullify_String_If_Empty_(ref string? str)
    {
        if (str == "" || str == string.Empty)
            str = null;
    }

    public static Result<T> CheckBpmDomain_<T>(decimal resultBpm)
    {
        if (resultBpm < 0.0M || resultBpm > 300.0M)
            return Result<T>.Failure(Error.PlaylistEntryBpmDomainError);

        return Result<T>.Success();
    }

    public static Result<T> CheckFirstMaster_<T>(uint nr, bool withPrev)
    {
        if (withPrev && nr == 1)
            return Result<T>.Failure(Error.PlaylistEntryFirstNotMaster);

        return Result<T>.Success();
    }
}
