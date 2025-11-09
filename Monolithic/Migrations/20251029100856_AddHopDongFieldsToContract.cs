using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddHopDongFieldsToContract : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractArchives");

            migrationBuilder.DropTable(
                name: "ContractTerminationEvidences");

            migrationBuilder.DropTable(
                name: "ContractTokens");

            migrationBuilder.DropTable(
                name: "ContractTerminations");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_ExpiresAt",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_IsActive",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Contracts");

            migrationBuilder.RenameColumn(
                name: "ExpiresAt",
                table: "Contracts",
                newName: "TokenExpiry");

            migrationBuilder.RenameColumn(
                name: "DeactivatedAt",
                table: "Contracts",
                newName: "NgayTao");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<string>(
                name: "BienSoXe",
                table: "Contracts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmationToken",
                table: "Contracts",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HoTenBenA",
                table: "Contracts",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

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
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Contracts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 29, 10, 8, 56, 569, DateTimeKind.Utc).AddTicks(9927));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                newName: "ExpiresAt");

            migrationBuilder.RenameColumn(
                name: "NgayTao",
                table: "Contracts",
                newName: "DeactivatedAt");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Contracts",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "ContractArchives",
                columns: table => new
                {
                    ArchivalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    DeactivatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeactivationReason = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsPermanentlyDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    RenterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScheduledForDeletionAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TerminationReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractArchives", x => x.ArchivalId);
                });

            migrationBuilder.CreateTable(
                name: "ContractTerminations",
                columns: table => new
                {
                    TerminationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TerminatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TerminatedFromIp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TerminatedUserAgent = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    TerminationInitiator = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractTerminations", x => x.TerminationId);
                });

            migrationBuilder.CreateTable(
                name: "ContractTokens",
                columns: table => new
                {
                    TokenId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    CanSign = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsedForSigning = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    SignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SignedFromIp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SignedUserAgent = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    TokenHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    TokenType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractTokens", x => x.TokenId);
                });

            migrationBuilder.CreateTable(
                name: "ContractTerminationEvidences",
                columns: table => new
                {
                    EvidenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    ImagePublicId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TerminationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractTerminationEvidences", x => x.EvidenceId);
                    table.ForeignKey(
                        name: "FK_ContractTerminationEvidences_ContractTerminations_TerminationId",
                        column: x => x.TerminationId,
                        principalTable: "ContractTerminations",
                        principalColumn: "TerminationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 29, 9, 6, 5, 200, DateTimeKind.Utc).AddTicks(1699));

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ExpiresAt",
                table: "Contracts",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_IsActive",
                table: "Contracts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ContractArchives_BookingId",
                table: "ContractArchives",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractArchives_ContractId",
                table: "ContractArchives",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractArchives_IsPermanentlyDeleted",
                table: "ContractArchives",
                column: "IsPermanentlyDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_ContractArchives_RenterId",
                table: "ContractArchives",
                column: "RenterId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractArchives_ScheduledForDeletionAt",
                table: "ContractArchives",
                column: "ScheduledForDeletionAt");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTerminationEvidences_TerminationId",
                table: "ContractTerminationEvidences",
                column: "TerminationId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTerminations_ContractId",
                table: "ContractTerminations",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTerminations_TerminatedBy",
                table: "ContractTerminations",
                column: "TerminatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTokens_ContractId",
                table: "ContractTokens",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTokens_ExpiresAt",
                table: "ContractTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTokens_TokenHash",
                table: "ContractTokens",
                column: "TokenHash");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTokens_TokenType",
                table: "ContractTokens",
                column: "TokenType");
        }
    }
}
