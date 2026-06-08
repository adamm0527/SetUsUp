using SetUsUpBE.Infrastructure.Configuration;
using SetUsUpBE.Infrastructure.DataEntities;
using SetUsUpBE.Infrastructure.IdentityExtensions;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace SetUsUpBE.Infrastructure.DbContext;

public sealed class AppDbContext : IdentityDbContext<AppIdentityUser> // supplying our own extended IdentityUser
{
    // MusicRepository related tables
    public DbSet<GroupData> Groups { get; set; }
    public DbSet<SongData> Songs { get; set; }
    public DbSet<PlaylistData> Playlists { get; set; }
    public DbSet<PlaylistEntryData> PlaylistEntries { get; set; }
    public DbSet<PlaylistEntryRatingData> PlaylistEntryRatings { get; set; }
    
    // MembershipRepository related tables
    public DbSet<GroupMembershipData> GroupMemberships { get; set; }
    public DbSet<SongAccessData> SongAccess { get; set; }

    // Tags (static reference data) + Song<->Tag join table
    public DbSet<TagCategoryData> TagCategories { get; set; }
    public DbSet<TagGroupData> TagGroups { get; set; }
    public DbSet<TagData> Tags { get; set; }
    public DbSet<SongTagData> SongTags { get; set; }

    // External Spotify link (parallel Application-layer entity, kept off the Domain Song)
    public DbSet<SongSpotifyLinkData> SongSpotifyLinks { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
            optionsBuilder.UseSqlServer(DbConfiguration.ConnectionString);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // -------- Explicit, defensive table mapping for all custom entities --------
        builder.Entity<GroupData>().ToTable("Groups");
        builder.Entity<GroupMembershipData>().ToTable("GroupMemberships");
        builder.Entity<SongData>().ToTable("Songs");
        builder.Entity<SongAccessData>().ToTable("SongAccess");
        builder.Entity<PlaylistData>().ToTable("Playlists");
        builder.Entity<PlaylistEntryData>().ToTable("PlaylistEntries");
        builder.Entity<PlaylistEntryRatingData>().ToTable("PlaylistEntryRatings");
        builder.Entity<TagCategoryData>().ToTable("TagCategories");
        builder.Entity<TagGroupData>().ToTable("TagGroups");
        builder.Entity<TagData>().ToTable("Tags");
        builder.Entity<SongTagData>().ToTable("SongTags");
        builder.Entity<SongSpotifyLinkData>().ToTable("SongSpotifyLinks");

        // Explicit relationship definitions to always resolve cyclic cascade deletes
        // note: collection nav. props always appear inside WithMany if present

        // -------- TagGroups -----------------------------------------------------------

        builder.Entity<GroupData>()
            .HasOne(g => g.CreatorUser)
            .WithMany()
            .HasForeignKey(g => g.CreatorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // -------- GroupMemberships -------------------------------------------------

        builder.Entity<GroupMembershipData>()
            .HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<GroupMembershipData>()
            .HasOne(m => m.Group)
            .WithMany()
            .HasForeignKey(m => m.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        // -------- Playlists --------------------------------------------------------

        builder.Entity<PlaylistData>()
            .HasOne(p => p.Group)
            .WithMany(g => g.Playlists)
            .HasForeignKey(p => p.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PlaylistData>()
            .HasOne(p => p.CreatorUser)
            .WithMany()
            .HasForeignKey(p => p.CreatorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // -------- PlaylistEntries --------------------------------------------------

        builder.Entity<PlaylistEntryData>()
            .HasOne(pe => pe.CreatorUser)
            .WithMany()
            .HasForeignKey(pe => pe.CreatorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PlaylistEntryData>()
            .HasOne(pe => pe.Song)
            .WithMany(s => s.PlaylistEntries)
            .HasForeignKey(pe => pe.SongId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PlaylistEntryData>()
            .HasOne(pe => pe.Playlist)
            .WithMany(p => p.Entries)
            .HasForeignKey(pe => pe.PlaylistId)
            .OnDelete(DeleteBehavior.Restrict);


        // -------- PlaylistEntryRatings ---------------------------------------------

        builder.Entity<PlaylistEntryRatingData>()
            .HasOne(per => per.RaterUser)
            .WithMany()
            .HasForeignKey(per => per.RaterUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PlaylistEntryRatingData>()
            .HasOne(per => per.PlaylistEntry)
            .WithMany(pe => pe.Ratings)
            .HasForeignKey(per => per.PlaylistEntryId)
            .OnDelete(DeleteBehavior.Restrict);

        // -------- SongAccess -------------------------------------------------------

        builder.Entity<SongAccessData>()
            .HasOne(a => a.CreatorUser)
            .WithMany()
            .HasForeignKey(a => a.CreatorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<SongAccessData>()
            .HasOne(a => a.Song)
            .WithMany()
            .HasForeignKey(a => a.SongId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<SongAccessData>()
            .HasOne(a => a.Group)
            .WithMany()
            .HasForeignKey(a => a.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        // -------- AspNetUsers ------------------------------------------------------

        builder.Entity<AppIdentityUser>()
            .HasOne(u => u.OwnGroup)
            .WithOne()
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AppIdentityUser>()
            .HasOne(u => u.SelectedGroup)
            .WithMany()
            .HasForeignKey(u => u.selectedGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AppIdentityUser>()
            .HasOne(u => u.SelectedPlaylist)
            .WithMany()
            .HasForeignKey(u => u.SelectedPlaylistId)
            .OnDelete(DeleteBehavior.Restrict);

        // -------- Tags (static reference data) -------------------------------------

        builder.Entity<TagGroupData>()
            .HasOne(tg => tg.Category)
            .WithMany(tc => tc.TagGroups)
            .HasForeignKey(tg => tg.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TagData>()
            .HasOne(t => t.TagGroup)
            .WithMany(tg => tg.Tags)
            .HasForeignKey(t => t.TagGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        // -------- SongTags (Song <-> Tag join) -------------------------------------

        builder.Entity<SongTagData>()
            .HasKey(st => new { st.SongId, st.TagId }); // composite PK

        builder.Entity<SongTagData>()
            .HasOne(st => st.Song)
            .WithMany()
            .HasForeignKey(st => st.SongId)
            .OnDelete(DeleteBehavior.Cascade); // wiping a Song wipes its Tag assignments

        builder.Entity<SongTagData>()
            .HasOne(st => st.Tag)
            .WithMany()
            .HasForeignKey(st => st.TagId)
            .OnDelete(DeleteBehavior.Restrict); // Tags are static (never deleted)

        // -------- SongSpotifyLink (parallel external-link entity, PK = SongId) -----

        builder.Entity<SongSpotifyLinkData>()
            .HasOne(l => l.Song)
            .WithOne()
            .HasForeignKey<SongSpotifyLinkData>(l => l.SongId)
            .OnDelete(DeleteBehavior.Cascade); // wiping a song wipes its Spotify link
    }
}
