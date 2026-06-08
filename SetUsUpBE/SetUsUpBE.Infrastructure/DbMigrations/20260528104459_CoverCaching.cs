using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SetUsUpBE.Infrastructure.DbMigrations
{
    /// <inheritdoc />
    public partial class CoverCaching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CachedCoverAt",
                table: "SongSpotifyLinks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CachedCoverUrl",
                table: "SongSpotifyLinks",
                type: "nvarchar(2048)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CachedCoverAt",
                table: "SongSpotifyLinks");

            migrationBuilder.DropColumn(
                name: "CachedCoverUrl",
                table: "SongSpotifyLinks");
        }
    }
}
