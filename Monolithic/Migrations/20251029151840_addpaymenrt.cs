using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class addpaymenrt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 29, 15, 18, 39, 976, DateTimeKind.Utc).AddTicks(1603));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 29, 15, 1, 55, 945, DateTimeKind.Utc).AddTicks(193));
        }
    }
}
