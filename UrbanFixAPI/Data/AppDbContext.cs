using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Models;

namespace UrbanFixAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<District> Districts { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Report> Reports { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<IssueCategory> IssueCategories { get; set; } = null!;
    public DbSet<Upvote> Upvotes { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Report entity relationships
        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasOne(r => r.Citizen)
                .WithMany()
                .HasForeignKey(r => r.CitizenId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Technician)
                .WithMany()
                .HasForeignKey(r => r.TechnicianId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Note: Snake_case mapping is handled via [Column] attributes in Models, 
        // but we can enforce remaining ones here if needed.
        // The prompt specifically asked to map column names to snake_case.
        
        // Ensure all tables are mapped correctly if not using attributes for everything
        modelBuilder.Entity<District>().ToTable("districts");
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Report>().ToTable("reports");
        modelBuilder.Entity<Notification>().ToTable("notifications");
        modelBuilder.Entity<IssueCategory>().ToTable("issue_categories");

        // Upvote: one upvote per user per report
        modelBuilder.Entity<Upvote>(entity =>
        {
            entity.HasOne(u => u.Report)
                  .WithMany()
                  .HasForeignKey(u => u.ReportId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(u => u.User)
                  .WithMany()
                  .HasForeignKey(u => u.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(u => new { u.ReportId, u.UserId }).IsUnique();
        });
    }
}
