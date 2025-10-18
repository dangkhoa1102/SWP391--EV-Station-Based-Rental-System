using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HopDong.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDBv3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "HopDongThueXes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayHetHan",
                table: "HopDongThueXes",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "HopDongThueXes");

            migrationBuilder.DropColumn(
                name: "NgayHetHan",
                table: "HopDongThueXes");
        }
    }
}
