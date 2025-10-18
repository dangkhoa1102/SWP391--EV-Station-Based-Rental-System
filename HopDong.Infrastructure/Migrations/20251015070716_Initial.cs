using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HopDong.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HopDongThueXes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SoHopDong = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NgayKy = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HoTenBenA = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BienSoXe = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HopDongThueXes", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HopDongThueXes");
        }
    }
}
