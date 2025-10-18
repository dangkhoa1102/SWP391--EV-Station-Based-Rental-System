using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HopDong.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDBv2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "NgayKy",
                table: "HopDongThueXes",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationToken",
                table: "HopDongThueXes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayTao",
                table: "HopDongThueXes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "HopDongThueXes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenExpiry",
                table: "HopDongThueXes",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfirmationToken",
                table: "HopDongThueXes");

            migrationBuilder.DropColumn(
                name: "NgayTao",
                table: "HopDongThueXes");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "HopDongThueXes");

            migrationBuilder.DropColumn(
                name: "TokenExpiry",
                table: "HopDongThueXes");

            migrationBuilder.AlterColumn<DateTime>(
                name: "NgayKy",
                table: "HopDongThueXes",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);
        }
    }
}
