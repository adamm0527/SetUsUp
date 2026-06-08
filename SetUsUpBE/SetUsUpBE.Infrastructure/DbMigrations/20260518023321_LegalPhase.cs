using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SetUsUpBE.Infrastructure.DbMigrations
{
    /// <inheritdoc />
    public partial class LegalPhase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpotifyAccount",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<int>(
                name: "AcceptedLegalVersion",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AcceptedSpotifyNoticeVersion",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastDataExportAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastInactivityWarningMilestone",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedLegalVersion",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AcceptedSpotifyNoticeVersion",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastDataExportAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastInactivityWarningMilestone",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<string>(
                name: "SpotifyAccount",
                table: "AspNetUsers",
                type: "nvarchar(32)",
                nullable: true);
        }
    }
}
