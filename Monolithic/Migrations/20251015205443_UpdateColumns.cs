using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class UpdateColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Bookings_BookingId",
                table: "Contracts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Contracts",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_BookingId",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_RenterId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ContractId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "BookingId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ConfirmationTokenHash",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ConfirmedFromIp",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ConfirmedUserAgent",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ContractContent",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ContractContentHash",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "IsConfirmed",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SignatureType",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SignatureValue",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SignerEmail",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "StaffId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Contracts");

            migrationBuilder.RenameColumn(
                name: "TokenExpiresAt",
                table: "Contracts",
                newName: "TokenExpiry");

            migrationBuilder.RenameColumn(
                name: "RenterId",
                table: "Contracts",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "ConfirmedAt",
                table: "Contracts",
                newName: "NgayTao");

            migrationBuilder.AddColumn<string>(
                name: "BienSoXe",
                table: "Contracts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationToken",
                table: "Contracts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HoTenBenA",
                table: "Contracts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Contracts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayHetHan",
                table: "Contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayKy",
                table: "Contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SoHopDong",
                table: "Contracts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Contracts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Contracts",
                table: "Contracts",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Contracts",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "BienSoXe",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ConfirmationToken",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "HoTenBenA",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "NgayHetHan",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "NgayKy",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "SoHopDong",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Contracts");

            migrationBuilder.RenameColumn(
                name: "TokenExpiry",
                table: "Contracts",
                newName: "TokenExpiresAt");

            migrationBuilder.RenameColumn(
                name: "NgayTao",
                table: "Contracts",
                newName: "ConfirmedAt");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Contracts",
                newName: "RenterId");

            migrationBuilder.AddColumn<Guid>(
                name: "ContractId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWID()");

            migrationBuilder.AddColumn<Guid>(
                name: "BookingId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationTokenHash",
                table: "Contracts",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmedFromIp",
                table: "Contracts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmedUserAgent",
                table: "Contracts",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractContent",
                table: "Contracts",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContractContentHash",
                table: "Contracts",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<bool>(
                name: "IsConfirmed",
                table: "Contracts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SignatureType",
                table: "Contracts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SignatureValue",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignerEmail",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StaffId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddPrimaryKey(
                name: "PK_Contracts",
                table: "Contracts",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_BookingId",
                table: "Contracts",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_RenterId",
                table: "Contracts",
                column: "RenterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Bookings_BookingId",
                table: "Contracts",
                column: "BookingId",
                principalTable: "Bookings",
                principalColumn: "BookingId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
