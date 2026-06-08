using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.ValueObjects;

namespace SetUsUpBE.Domain.Entities;

public sealed class Song : AggregateRoot
{
    private string artist;        // non-empty
    private string title;         // non-empty
    private TimeOnly duration;    // inside (0;24) hours (precisely, at least 1 second)
    private decimal bpm;          // inside [0;300]
    private decimal bpmOut;       // inside [0;300]
    private MusicalKey? initKey;  // domain restricted value object, not required


    private Song(string artist, string title, TimeOnly duration, decimal bpm, decimal bpmOut,
        MusicalKey? initKey, Guid? id = null)
    {
        this.artist = artist;
        this.title = title;
        this.duration = duration;
        this.bpm = bpm;
        this.bpmOut = bpmOut;
        this.initKey = initKey;
        if (id is not null)
            base.Id = (Guid)id;
    }

    public static Result<Song> Create(string artist, string title, TimeOnly duration, decimal bpm,
        decimal? bpmOut = null, string? initKeyStr = null, Guid? id = null)
    {
        // artist cannot be empty
        string trimmedArtist = TrimStr_(artist);
        var artistResult = CheckStringNotNullOrEmpty_<Song>(trimmedArtist, Error.SongArtistEmpty);
        if (artistResult.HasFailed)
            return artistResult;


        // title cannot be empty
        string trimmedTitle = TrimStr_(title);
        var titleResult = CheckStringNotNullOrEmpty_<Song>(trimmedTitle, Error.SongTitleEmpty);
        if (titleResult.HasFailed)
            return titleResult;


        // duration must be longer than 1 second and less than 24 hours (TimeOnly type enforces domain)
        var durationResult = CheckDurationDomain_<Song>(duration);
        if (durationResult.HasFailed)
            return durationResult;


        // bpm cannot be less than 0 or more than 300
        var bpmResult = CheckBpmDomain_<Song>(bpm);
        if (bpmResult.HasFailed)
            return bpmResult;

        if (bpmOut is not null) // if bpmOut is specified
        {
            var bpmOutResult = CheckBpmDomain_<Song>((decimal)bpmOut);
            if (bpmOutResult.HasFailed)
                return bpmOutResult;

            // bpm and bpmOut must be simultaneously zero or non-zero
            // (If bpm > 0, bpmOut cannot be 0
            //  and if bpm is 0, then bpmOut must be 0.)
            var bpmMismatchResult = CheckBpmBeatlessMismatch_<Song>(bpm, (decimal)bpmOut);
            if (bpmMismatchResult.HasFailed)
                return bpmMismatchResult;
        }
        else bpmOut = bpm; // if bpmOut isn't specified, then it will be the same as bpm
               

        MusicalKey? musicalKey = null; // key may not be specified
        if (initKeyStr is not null) // but if specified, must be in the correct format
        {
            var keyResult = MusicalKey.Create(initKeyStr);
            if (keyResult.HasFailed)
                return Result<Song>.Failure(keyResult.Error);

            musicalKey = keyResult.Value;
        }


        Song resultSong = new Song(trimmedArtist, trimmedTitle, duration, bpm, (decimal)bpmOut, musicalKey, id);
        return Result<Song>.Success(resultSong);
    }

    public string GetArtist() => artist;
    public Result<string> SetArtist(string artist)
    {
        // artist cannot be empty
        string trimmedArtist = TrimStr_(artist);
        var artistResult = CheckStringNotNullOrEmpty_<string>(trimmedArtist, Error.SongArtistEmpty);
        if (artistResult.HasFailed)
            return artistResult;

        this.artist = trimmedArtist;
        return Result<string>.Success(trimmedArtist);
    }

    public string GetTitle() => title;
    public Result<string> SetTitle(string title)
    {
        // title cannot be empty
        string trimmedTitle = TrimStr_(title);
        var titleResult = CheckStringNotNullOrEmpty_<string>(trimmedTitle, Error.SongTitleEmpty);
        if (titleResult.HasFailed)
            return titleResult;

        this.title = trimmedTitle;
        return Result<string>.Success(trimmedTitle);
    }

    public TimeOnly GetDuration() => duration;
    public Result<TimeOnly> SetDuration(TimeOnly duration)
    {
        // duration must be longer than 1 second and less than 24 hours (TimeOnly type enforces domain)
        var durationResult = CheckDurationDomain_<TimeOnly>(duration);
        if (durationResult.HasFailed)
            return durationResult;

        this.duration = duration;
        return Result<TimeOnly>.Success(duration);
    }

    public decimal GetBpm() => bpm;
    public Result<decimal> SetBpm(decimal bpm)
    {
        var bpmResult = CheckBpmDomain_<decimal>(bpm);
        if (bpmResult.HasFailed)
            return bpmResult;

        if (this.bpm == this.bpmOut)
        {
            this.bpmOut = bpm; // if bpm and bpmOut were the same (before the mutation), they both get set
            // they won't obviously mismatch in this case
        }
        else
        {
            var bpmMismatchResult = CheckBpmBeatlessMismatch_<decimal>(bpm, this.bpmOut);
            if (bpmMismatchResult.HasFailed)
                return bpmMismatchResult;
        }
            
        this.bpm = bpm;
        return Result<decimal>.Success(bpm);
    }

    public decimal GetBpmOut() => bpmOut;
    public Result<decimal> SetBpmOut(decimal bpmOut)
    {
        var bpmOutResult = CheckBpmDomain_<decimal>(bpmOut);
        if (bpmOutResult.HasFailed)
            return bpmOutResult;

        var bpmMismatchResult = CheckBpmBeatlessMismatch_<decimal>(this.bpm, bpmOut);
        if (bpmMismatchResult.HasFailed)
            return bpmMismatchResult;

        this.bpmOut = bpmOut;
        return Result<decimal>.Success(bpmOut);
    }

    public MusicalKey? GetInitKey() => initKey;
    public void SetInitKey(MusicalKey? musicalKey) => initKey = musicalKey;
    public Result<MusicalKey> SetInitKey(string initKeyStr)
    {
        MusicalKey? musicalKey = null; // key may not be specified
        if (initKeyStr is not null) // but if specified, must be in the correct format
        {
            var keyResult = MusicalKey.Create(initKeyStr);
            if (keyResult.HasFailed)
                return Result<MusicalKey>.Failure(keyResult.Error);

            musicalKey = keyResult.Value;
        }

        this.initKey = musicalKey;
        return Result<MusicalKey>.Success(musicalKey);
    }

    public bool IsKeySet() => initKey is not null;


    // Validation checks
    // The Create factory and the Setters both use these as invariants
    // (validation logic should only be modified here)

    private static Result<T> CheckStringNotNullOrEmpty_<T>(string str, Error raisedError)
    {
        if (string.IsNullOrEmpty(str))
            return Result<T>.Failure(raisedError);

        return Result<T>.Success();
    }

    private static Result<T> CheckDurationDomain_<T>(TimeOnly duration)
    {
        if (duration < TimeOnly.FromTimeSpan(TimeSpan.FromSeconds(1))) // Timespan type itself guarantees that it's less than 24 hours
            return Result<T>.Failure(Error.SongDurationDomainError);

        return Result<T>.Success();
    }

    private static Result<T> CheckBpmDomain_<T>(decimal bpm)
    {
        if (bpm < 0.0M || bpm > 300.0M)
            return Result<T>.Failure(Error.SongBpmDomainError);

        return Result<T>.Success();
    }

    private static Result<T> CheckBpmBeatlessMismatch_<T>(decimal bpm, decimal bpmOut)
    {
        if ((bpm == 0 && bpmOut != 0) || (bpm != 0 && bpmOut == 0))
            return Result<T>.Failure(Error.SongBpmBeatlessMismatch);

        return Result<T>.Success();
    }

    private static string TrimStr_(string str)
    {
        if (str is null)
            return string.Empty;
        else
            return str.Trim();
    }
}
