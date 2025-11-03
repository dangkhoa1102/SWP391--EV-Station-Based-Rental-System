using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddCarTechnicalStatusAndHandover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BrakeStatus",
                table: "Cars",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EngineStatus",
                table: "Cars",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExteriorStatus",
                table: "Cars",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InteriorStatus",
                table: "Cars",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastInspectionDate",
                table: "Cars",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LightStatus",
                table: "Cars",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechnicalNotes",
                table: "Cars",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TireStatus",
                table: "Cars",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CarHandovers",
                columns: table => new
                {
                    HandoverId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CarId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StaffId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HandoverType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PhotoUrls = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    PhotoPublicIds = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    BatteryLevelAtHandover = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    MileageReading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    HandoverDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarHandovers", x => x.HandoverId);
                    table.ForeignKey(
                        name: "FK_CarHandovers_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "BookingId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CarHandovers_Cars_CarId",
                        column: x => x.CarId,
                        principalTable: "Cars",
                        principalColumn: "CarId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CarHandovers_Users_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 31, 9, 7, 17, 981, DateTimeKind.Utc).AddTicks(1515));

            migrationBuilder.CreateIndex(
                name: "IX_CarHandovers_BookingId",
                table: "CarHandovers",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_CarHandovers_CarId",
                table: "CarHandovers",
                column: "CarId");

            migrationBuilder.CreateIndex(
                name: "IX_CarHandovers_HandoverDateTime",
                table: "CarHandovers",
                column: "HandoverDateTime");

            migrationBuilder.CreateIndex(
                name: "IX_CarHandovers_StaffId",
                table: "CarHandovers",
                column: "StaffId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CarHandovers");

            migrationBuilder.DropColumn(
                name: "BrakeStatus",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "EngineStatus",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "ExteriorStatus",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "InteriorStatus",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "LastInspectionDate",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "LightStatus",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TechnicalNotes",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TireStatus",
                table: "Cars");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 29, 10, 8, 56, 569, DateTimeKind.Utc).AddTicks(9927));
        }
    }
}
