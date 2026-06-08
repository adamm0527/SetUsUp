namespace SetUsUpBE.Application.AppEntityInterfaces;

// Encodes the selection rules for Tags inside a TagGroup.
public enum TagGroupType
{
    MX  = 0, // Mandatory & eXclusive (radio-like)
    OX  = 1, // Optional  & eXclusive (radio-like)
    OM  = 2, // Optional  & Multi (checkbox-like)
    MXP = 3, // Mandatory & eXclusive & Pivot/Parent
    OMC = 4, // Optional  & Multi     & Conditional/Children
    OXC = 5  // Optional  & eXclusive (01..09) AND Multi (10+) hybrid
}

// A cluster of related Tags inside a TagCategory.
public interface ITagGroup
{
    string Id { get; set; } // 5-char code, e.g. "SFXBL"
    string Name { get; set; } // displayed name, e.g. "Bassline"
    TagGroupType Type { get; set; } // selection rules
    string CategoryId { get; set; } // FK to parent ITagCategory.Id
}
