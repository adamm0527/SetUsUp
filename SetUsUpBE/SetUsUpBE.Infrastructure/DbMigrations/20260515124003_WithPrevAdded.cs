using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SetUsUpBE.Infrastructure.DbMigrations
{
    /// <inheritdoc />
    public partial class WithPrevAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "WithPrev",
                table: "PlaylistEntries",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WithPrev",
                table: "PlaylistEntries");
        }
    }
}
