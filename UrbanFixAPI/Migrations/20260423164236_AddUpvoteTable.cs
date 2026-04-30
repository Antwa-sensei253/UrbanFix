using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanFixAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUpvoteTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "report_upvotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    report_id = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_report_upvotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_report_upvotes_reports_report_id",
                        column: x => x.report_id,
                        principalTable: "reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_report_upvotes_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_report_upvotes_report_id_user_id",
                table: "report_upvotes",
                columns: new[] { "report_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_report_upvotes_user_id",
                table: "report_upvotes",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "report_upvotes");
        }
    }
}
