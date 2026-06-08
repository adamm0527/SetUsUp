namespace SetUsUpBE.Application.AppEntityInterfaces;

// top-level grouping of TagGroups
public interface ITagCategory
{
    string Id { get; set; } // 3-char code, e.g. "ENR"
    string Name { get; set; } // displayed name, e.g. "Energy"
}
