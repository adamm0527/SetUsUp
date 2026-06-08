using System.ComponentModel.DataAnnotations.Schema;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Infrastructure.DataEntities;
using Microsoft.AspNetCore.Identity;

namespace SetUsUpBE.Infrastructure.IdentityExtensions;

public sealed class AppIdentityUser : IdentityUser, IAppUser
{
    [ForeignKey(nameof(OwnGroup))]
    internal Guid? ownGroupId = null;
    public GroupData? OwnGroup { get; set; } // Navigation property


    [ForeignKey(nameof(SelectedGroup))]
    internal Guid? selectedGroupId = null;
    public GroupData? SelectedGroup { get; set; } // Navigation property


    [ForeignKey(nameof(SelectedPlaylist))]
    public Guid? SelectedPlaylistId { get; set; } = null;
    public PlaylistData? SelectedPlaylist { get; set; } // Navigation property


    // Implementing IAppUser (null-safe access to properties)
    // These following are only for memory access.
    // Persistent mutation has to be performed with the above fields!

    [NotMapped]
    public Guid OwnGroupId
    {
        get => (Guid)ownGroupId!;
        set => ownGroupId = value;
    }

    [NotMapped]
    public Guid SelectedGroupId
    {
        get => (Guid)selectedGroupId!;
        set => selectedGroupId = value;
    }

    [NotMapped]
    public new required string UserName
    {
        get => base.UserName!;
        set => base.UserName = value;
    }

    [NotMapped]
    public new required string Email
    {
        get => base.Email!;
        set => base.Email = value;
    }


    // The following are regular attributes that can be easily mapped.
    // Why possible: they are non-FK and not clashing with prebuilt attributes of IdentityUser.

    [Column(TypeName = "nvarchar(32)")]
    public string? InstagramAccount { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public int? LastInactivityWarningMilestone { get; set; }

    public DateTime? LastDataExportAt { get; set; }

    public int AcceptedLegalVersion { get; set; } = 0;

    public int AcceptedSpotifyNoticeVersion { get; set; } = 0;

    [Column(TypeName = "nvarchar(32)")] // Size: 5 IDs x 5 chars + 4 commas = 29 chars worst-case
    public string? DisplayedTagGroupIdsCsv { get; set; }
}
