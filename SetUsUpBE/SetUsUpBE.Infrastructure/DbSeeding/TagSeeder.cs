using System.Reflection;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Infrastructure.DbContext;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Seeding;

/* Idempotent seeder for static Tag reference data.
   Reads 3 CSV files embedded as resources in the assembly and populates the TagCategories/TagGroups/Tags tables.
   Skips work if the tables are already populated.
   Intended to run once on app start-up (see DependencyInjection.EnsureSeededAsync). */
public static class TagSeeder
{
    // Ensures the Tag static tables exist and contain the seed data.
    public static async Task EnsureSeededAsync(DbContextOptions<AppDbContext> options, CancellationToken ct = default)
    {
        using var context = new AppDbContext(options);

        // ensure the schema is present (migrations should have already done this, but be defensive)
        await context.Database.EnsureCreatedAsync(ct);

        // skip if already seeded
        bool alreadyHasCategories = await context.Set<TagCategoryData>().AnyAsync(ct);
        bool alreadyHasGroups = await context.Set<TagGroupData>().AnyAsync(ct);
        bool alreadyHasTags = await context.Set<TagData>().AnyAsync(ct);
        if (alreadyHasCategories && alreadyHasGroups && alreadyHasTags)
            return;

        var assembly = typeof(TagSeeder).Assembly;

        /* --- categories --- */
        if (!alreadyHasCategories)
        {
            var rows = ReadCsv_(assembly, Properties.Resources.tag_categories);
            foreach (var row in rows)
            {
                context.Set<TagCategoryData>().Add(new TagCategoryData
                {
                    Id = row[0],
                    Name = row[1]
                });
            }
            await context.SaveChangesAsync(ct);
        }

        /* --- groups --- */
        if (!alreadyHasGroups)
        {
            var rows = ReadCsv_(assembly, Properties.Resources.tag_groups);
            foreach (var row in rows)
            {
                var groupId = row[0];
                var name = row[1];
                var typeCode = row[2];
                var categoryId = InferCategoryId_(groupId); // first 3 chars

                context.Set<TagGroupData>().Add(new TagGroupData
                {
                    Id = groupId,
                    Name = name,
                    Type = ParseGroupType_(typeCode),
                    CategoryId = categoryId
                });
            }
            await context.SaveChangesAsync(ct);
        }

        /* --- tags --- */
        if (!alreadyHasTags)
        {
            var rows = ReadCsv_(assembly, Properties.Resources.tag_tags);
            foreach (var row in rows)
            {
                var tagId = row[0];
                var name = row[1];
                var description = row[2];
                var groupId = InferGroupIdForTag_(tagId);

                context.Set<TagData>().Add(new TagData
                {
                    Id = tagId,
                    Name = name,
                    Description = description,
                    TagGroupId = groupId
                });
            }
            await context.SaveChangesAsync(ct);
        }
    }

    // First 3 characters of a 5-char group ID (e.g. "SCHLF" -> "SCH").
    private static string InferCategoryId_(string groupId) => groupId.Substring(0, 3);

    // e.g. "ENRGY04" -> group "ENRGY"
    private static string InferGroupIdForTag_(string tagId) => tagId.Substring(0, 5);


    private static TagGroupType ParseGroupType_(string code)
    {
        switch (code.Trim().ToUpperInvariant())
        {
            case "MX":  return TagGroupType.MX;
            case "OX":  return TagGroupType.OX;
            case "OM":  return TagGroupType.OM;
            case "MXP": return TagGroupType.MXP;
            case "OMC": return TagGroupType.OMC;
            case "OXC": return TagGroupType.OXC;
            default:
                throw new InvalidOperationException($"Unknown TagGroupType code '{code}'");
        }
    }

    /* Reads an embedded CSV resource and returns its rows (excluding the header).
       Supports double-quoted fields that may contain commas. */
    private static List<string[]> ReadCsv_(Assembly assembly, byte[] resource)
    {
        using var resourceStream = new MemoryStream(resource);
        using var reader = new StreamReader(resourceStream, Encoding.UTF8);
        var rows = new List<string[]>();
        bool firstLine = true;
        while (!reader.EndOfStream)
        {
            var line = reader.ReadLine();
            if (line is null) break;
            if (firstLine) { firstLine = false; continue; } // skip header
            if (string.IsNullOrWhiteSpace(line)) continue;

            rows.Add(ParseCsvLine_(line));
        }

        return rows;
    }

    // Minimal CSV-line parser: supports double-quoted fields with embedded commas and double-double-quote escapes.
    private static string[] ParseCsvLine_(string line)
    {
        var fields = new List<string>();
        var current = new StringBuilder();
        bool inQuotes = false;
        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (inQuotes)
            {
                if (c == '"')
                {
                    // could be an escaped quote or the closing quote
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++; // skip the escape pair
                    }
                    else inQuotes = false;
                }
                else current.Append(c);
            }
            else
            {
                if (c == ',')
                {
                    fields.Add(current.ToString());
                    current.Clear();
                }
                else if (c == '"')
                    inQuotes = true;
                else
                    current.Append(c);
            }
        }
        fields.Add(current.ToString());
        return fields.ToArray();
    }
}
