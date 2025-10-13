using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class updateBookingDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Stations_DropoffStationId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "DropoffStationId",
                table: "Bookings",
                newName: "ReturnStationId");

            migrationBuilder.RenameIndex(
                name: "IX_Bookings_DropoffStationId",
                table: "Bookings",
                newName: "IX_Bookings_ReturnStationId");

            migrationBuilder.AddColumn<DateTime>(
                name: "ActualReturnDateTime",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BookingStatus",
                table: "Bookings",
                type: "int",
                maxLength: 50,
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DailyRate",
                table: "Bookings",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "Bookings",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Bookings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Stations_ReturnStationId",
                table: "Bookings",
                column: "ReturnStationId",
                principalTable: "Stations",
                principalColumn: "StationId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Stations_ReturnStationId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ActualReturnDateTime",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "BookingStatus",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DailyRate",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "ReturnStationId",
                table: "Bookings",
                newName: "DropoffStationId");

            migrationBuilder.RenameIndex(
                name: "IX_Bookings_ReturnStationId",
                table: "Bookings",
                newName: "IX_Bookings_DropoffStationId");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Bookings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Stations_DropoffStationId",
                table: "Bookings",
                column: "DropoffStationId",
                principalTable: "Stations",
                principalColumn: "StationId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
