using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteFieldsToIncidents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Incidents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "Incidents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Incidents",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 11, 16, 2, 55, 31, 464, DateTimeKind.Utc).AddTicks(5051));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Incidents");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 11, 14, 19, 20, 10, 179, DateTimeKind.Utc).AddTicks(3962));
        }
    }
}
