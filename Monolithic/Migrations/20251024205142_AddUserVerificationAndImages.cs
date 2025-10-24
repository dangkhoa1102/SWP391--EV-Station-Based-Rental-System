using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddUserVerificationAndImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CccdImagePublicId",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CccdImageUrl",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GplxImagePublicId",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GplxImageUrl",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CccdImagePublicId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CccdImageUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "GplxImagePublicId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "GplxImageUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "Users");
        }
    }
}
