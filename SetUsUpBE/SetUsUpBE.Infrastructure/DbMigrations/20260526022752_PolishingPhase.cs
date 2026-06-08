using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SetUsUpBE.Infrastructure.DbMigrations
{
    /// <inheritdoc />
    public partial class PolishingPhase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BpmChange",
                table: "PlaylistEntries",
                type: "decimal(8,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DisplayedTagGroupIdsCsv",
                table: "AspNetUsers",
                type: "nvarchar(32)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BpmChange",
                table: "PlaylistEntries");

            migrationBuilder.DropColumn(
                name: "DisplayedTagGroupIdsCsv",
                table: "AspNetUsers");
        }
    }
}
