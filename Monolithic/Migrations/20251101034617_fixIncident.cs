using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class fixIncident : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Images",
                table: "Incidents",
                newName: "ImageUrls");

            migrationBuilder.AddColumn<string>(
                name: "ImagePublicIds",
                table: "Incidents",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 11, 1, 3, 46, 16, 697, DateTimeKind.Utc).AddTicks(418));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePublicIds",
                table: "Incidents");

            migrationBuilder.RenameColumn(
                name: "ImageUrls",
                table: "Incidents",
                newName: "Images");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 30, 17, 10, 6, 921, DateTimeKind.Utc).AddTicks(999));
        }
    }
}
