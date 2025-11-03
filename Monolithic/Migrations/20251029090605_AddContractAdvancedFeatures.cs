using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monolithic.Migrations
{
    /// <inheritdoc />
    public partial class AddContractAdvancedFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeactivatedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "Contracts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Contracts",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "CarImagePublicId",
                table: "Cars",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContractArchives",
                columns: table => new
                {
                    ArchivalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RenterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeactivationReason = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DeactivatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ContractSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TerminationReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ScheduledForDeletionAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsPermanentlyDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
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
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TerminatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TerminationInitiator = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TerminatedFromIp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TerminatedUserAgent = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
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
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    TokenType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CanSign = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsUsedForSigning = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SignedFromIp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SignedUserAgent = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
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
                    TerminationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ImagePublicId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
                name: "DeactivatedAt",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CarImagePublicId",
                table: "Cars");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Contracts",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "CreatedAt",
                value: new DateTime(2025, 10, 28, 8, 30, 27, 190, DateTimeKind.Utc).AddTicks(4118));
        }
    }
}
