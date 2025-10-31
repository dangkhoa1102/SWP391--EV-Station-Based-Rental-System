using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddUserImageFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GplxImageUrl",
                table: "Users",
                newName: "GplxImageUrl_Front");

            migrationBuilder.RenameColumn(
                name: "GplxImagePublicId",
                table: "Users",
                newName: "GplxImageUrl_Back");

            migrationBuilder.RenameColumn(
                name: "CccdImageUrl",
                table: "Users",
                newName: "GplxImagePublicId_Front");

            migrationBuilder.RenameColumn(
                name: "CccdImagePublicId",
                table: "Users",
                newName: "GplxImagePublicId_Back");

            migrationBuilder.AddColumn<string>(
                name: "CccdImagePublicId_Back",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CccdImagePublicId_Front",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CccdImageUrl_Back",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CccdImageUrl_Front",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CccdImagePublicId_Back",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CccdImagePublicId_Front",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CccdImageUrl_Back",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CccdImageUrl_Front",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "GplxImageUrl_Front",
                table: "Users",
                newName: "GplxImageUrl");

            migrationBuilder.RenameColumn(
                name: "GplxImageUrl_Back",
                table: "Users",
                newName: "GplxImagePublicId");

            migrationBuilder.RenameColumn(
                name: "GplxImagePublicId_Front",
                table: "Users",
                newName: "CccdImageUrl");

            migrationBuilder.RenameColumn(
                name: "GplxImagePublicId_Back",
                table: "Users",
                newName: "CccdImagePublicId");
        }
    }
}
