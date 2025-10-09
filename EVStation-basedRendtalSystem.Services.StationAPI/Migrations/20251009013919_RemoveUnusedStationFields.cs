using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EVStation_basedRendtalSystem.Services.StationAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnusedStationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the index on City before dropping the column
            migrationBuilder.DropIndex(
                name: "IX_Stations_City",
                table: "Stations");

            // Drop all unused columns
            migrationBuilder.DropColumn(
                name: "City",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "Province",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "OpeningTime",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "ClosingTime",
                table: "Stations");

            migrationBuilder.DropColumn(
                name: "IsOpen24Hours",
                table: "Stations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Re-add all removed columns
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Stations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Province",
                table: "Stations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "Stations",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Stations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Stations",
                type: "float(10)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Stations",
                type: "float(10)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "OpeningTime",
                table: "Stations",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "ClosingTime",
                table: "Stations",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsOpen24Hours",
                table: "Stations",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Re-create the index on City
            migrationBuilder.CreateIndex(
                name: "IX_Stations_City",
                table: "Stations",
                column: "City");
        }
    }
}
