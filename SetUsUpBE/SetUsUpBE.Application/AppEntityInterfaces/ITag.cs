namespace SetUsUpBE.Application.AppEntityInterfaces;

// The leaf entry of the tagging system that can be associated with a Song.
public interface ITag
{
    string Id { get; set; } // 7-char code, e.g. "SFXBL16"
    string Name { get; set; } // displayed name, e.g. "808Bass"
    string Description { get; set; } // helps User determine whether this Tag belongs on a Song
    string TagGroupId { get; set; } // FK to parent ITagGroup.Id
}
