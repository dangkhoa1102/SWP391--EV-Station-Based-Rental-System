using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddHardcodedAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "Address", "CccdImagePublicId_Back", "CccdImagePublicId_Front", "CccdImageUrl_Back", "CccdImageUrl_Front", "CreatedAt", "DateOfBirth", "DriverLicenseExpiry", "DriverLicenseNumber", "Email", "FirstName", "GplxImagePublicId_Back", "GplxImagePublicId_Front", "GplxImageUrl_Back", "GplxImageUrl_Front", "IsActive", "IsVerified", "LastName", "PasswordHash", "PhoneNumber", "RefreshToken", "RefreshTokenExpiry", "UpdatedAt", "UserName", "UserRole" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000001"), null, null, null, null, null, new DateTime(2025, 10, 28, 8, 22, 15, 871, DateTimeKind.Utc).AddTicks(9964), new DateOnly(1, 1, 1), null, null, "admin@ev.com", "Admin", null, null, null, null, true, true, "User", "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=", null, null, null, null, "admin@ev.com", "Admin" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));
        }
    }
}
