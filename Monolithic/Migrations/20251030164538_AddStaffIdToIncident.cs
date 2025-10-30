using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffIdToIncident : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "StaffId",
                table: "Incidents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 30, 16, 45, 38, 52, DateTimeKind.Utc).AddTicks(4279));

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_StaffId",
                table: "Incidents",
                column: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidents_Users_StaffId",
                table: "Incidents",
                column: "StaffId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidents_Users_StaffId",
                table: "Incidents");

            migrationBuilder.DropIndex(
                name: "IX_Incidents_StaffId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "StaffId",
                table: "Incidents");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 30, 16, 41, 56, 486, DateTimeKind.Utc).AddTicks(9984));
        }
    }
}
