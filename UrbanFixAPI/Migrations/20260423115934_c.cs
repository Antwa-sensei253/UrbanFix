using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanFixAPI.Migrations
{
    /// <inheritdoc />
    public partial class c : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "estimated_cost",
                table: "reports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "is_public",
                table: "reports",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "budget_limit",
                table: "districts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "estimated_cost",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "is_public",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "budget_limit",
                table: "districts");
        }
    }
}
