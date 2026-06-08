using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.DomainEvents;

namespace SetUsUpBE.Domain.Entities;

public sealed class Playlist : AggregateRoot
{
    private readonly Group ownerGroup;
    private string name; // non-empty
    private string? description; // if empty, null
    private TimeSpan duration; // updated when an entry is added
    private readonly List<PlaylistEntry> entries;


    private Playlist(Group ownerGroup, string name, string? description = null, Guid? id = null)
    {
        this.ownerGroup = ownerGroup;
        this.name = name;
        this.description = description;
        duration = TimeSpan.Zero;
        entries = new List<PlaylistEntry>();

        if (description is not null)
            this.description = description.Trim();

        if (id is not null)
            base.Id = (Guid)id;
    }

    public static Result<Playlist> Create(Group ownerGroup, string name, string? description = null, Guid? id = null)
    {
        // name cannot be empty
        string trimmedName = TrimName_(name);
        var nameResult = CheckStringNotNullOrEmpty_<Playlist>(trimmedName, Error.PlaylistNameEmpty);
        if (nameResult.HasFailed)
            return nameResult;

        Nullify_String_If_Empty_(ref description);

        Playlist resultPlaylist = new Playlist(ownerGroup, trimmedName, description, id);
        return Result<Playlist>.Success(resultPlaylist);
    }

    public Group GetOwnerGroup() => ownerGroup;

    public string GetName() => name;
    public Result<string> SetName(string name)
    {
        string trimmedName = TrimName_(name);
        var nameResult = CheckStringNotNullOrEmpty_<string>(trimmedName, Error.PlaylistNameEmpty);
        if (nameResult.HasFailed)
            return nameResult;

        this.name = name;
        return Result<string>.Success(name);
    }

    public string? GetDescription() => description;
    public void SetDescription(string? description)
    {
        Nullify_String_If_Empty_(ref description);
        this.description = description;
        if (this.description is not null)
            this.description = this.description.Trim();
    }

    public TimeSpan GetDuration() => duration;

    public void UpdateDuration()
    {
        this.duration = TimeSpan.Zero;
        for (int i = 0; i < entries.Count; ++i)
            this.duration += entries[i].GetDuration();
    }

    public int GetEntriesCount() => entries.Count;

    // indexer for entries
    public PlaylistEntry this[int i] => entries[i]; // WARNING: should not be exposed at api side

    public Result<Playlist> AddEntryAt(PlaylistEntry entry, int idx = -1)
    {
        var duplicateEntryResult = CheckNewEntryDuplicate_<Playlist>(entries, entry);
        if (duplicateEntryResult.HasFailed)
            return duplicateEntryResult;

        var entryMismatchedParentResult = CheckNewEntryParentMismatch_<Playlist>(this, entry);
        if (entryMismatchedParentResult.HasFailed)
            return entryMismatchedParentResult;

        if (idx <= -1 || idx > entries.Count)
            idx = entries.Count; // default point of insertion is at the end

        this.entries.Insert(idx, entry);
        if (!entry.GetWithPrev())
            this.duration += entry.GetDuration();
        UpdateOrder_();
        return Result<Playlist>.Success(this);
    }

    public void MoveEntry(int movedIdx, int destIdx)
    {
        if (movedIdx < 0 || movedIdx >= entries.Count || movedIdx == destIdx)
            return; // if no valid entry is selected, or the destination is the same, nothing happens

        // constraining the destination index to valid bounds
        if (destIdx < 0)
            destIdx = 0;
        if (destIdx >= entries.Count)
            destIdx = entries.Count - 1;

        var movedEntry = entries[movedIdx];
        entries.RemoveAt(movedIdx);
        entries.Insert(destIdx, movedEntry);

        // duration won't change
        UpdateOrder_();
    }
    
    public void RemoveEntryAt(int delIdx)
    {
        if (delIdx < 0 || delIdx >= entries.Count)
            return; // if the index of the entry to be removed is outside bounds, nothing happens

        var deletedEntry = entries[delIdx];
        entries.RemoveAt(delIdx);
        if (!deletedEntry.GetWithPrev())
            duration -= deletedEntry.GetDuration();
        UpdateOrder_();
    }

    public int FindEntryNr(Guid entryId)
    {
        for (int i = 0; i < entries.Count; ++i)
            if (entries[i].Id == entryId)
                return i + 1;

        return 0;
    }
    
    public void ClearEntries()
    {
        entries.Clear();
        duration = TimeSpan.Zero;
    }

    // Validation checks
    // The Create factory and the Setters both use these as invariants
    // (validation logic should only be modified here)

    private static Result<T> CheckStringNotNullOrEmpty_<T>(string str, Error raisedError)
    {
        if (string.IsNullOrEmpty(str))
            return Result<T>.Failure(raisedError);

        return Result<T>.Success();
    }

    private static Result<T> CheckNewEntryDuplicate_<T>(List<PlaylistEntry> entries, PlaylistEntry newEntry)
    {
        if (entries.Exists(e => e.Id == newEntry.Id))
            return Result<T>.Failure(Error.PlaylistNewEntryDuplicate);

        return Result<T>.Success();
    }

    private static Result<T> CheckNewEntryParentMismatch_<T>(Playlist playlist, PlaylistEntry newEntry)
    {
        if (playlist != newEntry.GetParentPlaylist())
            return Result<T>.Failure(Error.PlaylistNewEntryParentMismatch);

        return Result<T>.Success();
    }

    private static void Nullify_String_If_Empty_(ref string? str)
    {
        if (str == "" || str == string.Empty)
            str = null;
    }

    private void UpdateOrder_()
    {
        if (entries.Count == 0)
            return;

        var orderChangedEvent = PlaylistOrderChanged.Raise((uint)entries.Count);
        
        if (entries.Count == 1)
        {
            entries[0].Handle(orderChangedEvent);
            return;
        }

        for (int i = 0; i < entries.Count - 1; i++)
        {
            var currEntry = entries[i];
            var nextEntry = entries[i + 1];
            currEntry.Handle(orderChangedEvent, nextEntry);
        }
        entries.Last().Handle(orderChangedEvent, null);
        
        // Handle reassigns the numbers of the entries in order
        // and assigns the transition types (see: MixVariant) between entries
    }
    private static string TrimName_(string name)
    {
        if (name is null)
            return string.Empty;
        else
            return name.Trim();
    }
}
