using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Models;

namespace UrbanFixAPI.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // 1. Ensure District exists
        if (!await context.Districts.AnyAsync())
        {
            context.Districts.Add(new District { Name = "Nasr City" });
            await context.SaveChangesAsync();
        }

        var district = await context.Districts.FirstAsync();

        // 2. Seed Users
        async Task EnsureUser(string nationalId, string fullName, string email, string role, int? distId = null)
        {
            if (!await context.Users.AnyAsync(u => u.NationalId == nationalId))
            {
                context.Users.Add(new User
                {
                    FullName = fullName,
                    NationalId = nationalId,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Environment.GetEnvironmentVariable("SEED_PASSWORD") ?? "Pass123"),
                    Email = email,
                    Role = role,
                    DistrictId = distId,
                    IsVerified = true
                });
                await context.SaveChangesAsync();
            }
        }

        await EnsureUser(Environment.GetEnvironmentVariable("SEED_GOVERNOR_NID") ?? "100100", "Ahmad Abdulrahim", Environment.GetEnvironmentVariable("SEED_GOVERNOR_EMAIL") ?? "governor@urbanfix.com", "Governor");
        await EnsureUser(Environment.GetEnvironmentVariable("SEED_MANAGER_NID") ?? "200200", "Mohamed Ali", Environment.GetEnvironmentVariable("SEED_MANAGER_EMAIL") ?? "manager@urbanfix.com", "DistrictManager", district.Id);
        await EnsureUser(Environment.GetEnvironmentVariable("SEED_TECH1_NID") ?? "300300", "Ali", Environment.GetEnvironmentVariable("SEED_TECH1_EMAIL") ?? "tech@urbanfix.com", "Technician", district.Id);
        await EnsureUser(Environment.GetEnvironmentVariable("SEED_TECH2_NID") ?? "300301", "Ahmed", Environment.GetEnvironmentVariable("SEED_TECH2_EMAIL") ?? "ahmed.tech@urbanfix.com", "Technician", district.Id);
        await EnsureUser(Environment.GetEnvironmentVariable("SEED_CITIZEN_NID") ?? "400400", "Abdo", Environment.GetEnvironmentVariable("SEED_CITIZEN_EMAIL") ?? "citizen@urbanfix.com", "Citizen", district.Id);

        // 3. Seed Reports for Analytics
        var citizenNid = Environment.GetEnvironmentVariable("SEED_CITIZEN_NID") ?? "400400";
        if (!await context.Reports.AnyAsync(r => r.Citizen.NationalId == citizenNid))
        {
            var citizen = await context.Users.FirstAsync(u => u.NationalId == citizenNid && u.Role == "Citizen");
            var tech = await context.Users.FirstAsync(u => u.Role == "Technician");
            
            // Clear existing sample reports to replace with correctly targeted ones
            var oldReports = await context.Reports.ToListAsync();
            if (oldReports.Any())
            {
                context.Reports.RemoveRange(oldReports);
                await context.SaveChangesAsync();
            }

            var sampleReports = new List<Report>
            {
                new Report
                {
                    CitizenId = citizen.Id,
                    Category = "Pothole",
                    Urgency = "High",
                    Status = "Resolved",
                    Description = "Large pothole in the middle of the street.",
                    AddressDescription = "Abbas El Akkad St",
                    Latitude = 30.0566m,
                    Longitude = 31.3301m,
                    EstimatedCost = 2500,
                    IsPublic = true,
                    TechnicianId = tech.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new Report
                {
                    CitizenId = citizen.Id,
                    Category = "Streetlight",
                    Urgency = "Medium",
                    Status = "InProgress",
                    Description = "Streetlight flickering continuously.",
                    AddressDescription = "Makram Ebeid St",
                    Latitude = 30.0531m,
                    Longitude = 31.3415m,
                    EstimatedCost = 500,
                    IsPublic = false,
                    TechnicianId = tech.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new Report
                {
                    CitizenId = citizen.Id,
                    Category = "Water Leak",
                    Urgency = "Critical",
                    Status = "Reported",
                    Description = "Pipe burst, water wasting.",
                    AddressDescription = "Nasr Rd",
                    Latitude = 30.0612m,
                    Longitude = 31.3259m,
                    EstimatedCost = 1200,
                    IsPublic = true,
                    CreatedAt = DateTime.UtcNow.AddHours(-2)
                },
                new Report
                {
                    CitizenId = citizen.Id,
                    Category = "Dirty Street",
                    Urgency = "Low",
                    Status = "Resolved",
                    Description = "Street litter already cleaned by maintenance team.",
                    AddressDescription = "Makram Ebeid St",
                    Latitude = 30.0530m,
                    Longitude = 31.3410m,
                    EstimatedCost = 250,
                    IsPublic = true,
                    TechnicianId = tech.Id,
                    CreatedAt = DateTime.UtcNow.AddHours(-3),
                    UpdatedAt = DateTime.UtcNow.AddHours(-1)
                }
            };

            context.Reports.AddRange(sampleReports);
            await context.SaveChangesAsync();
        }

        // 4. Seed default Issue Categories
        if (!await context.IssueCategories.AnyAsync())
        {
            context.IssueCategories.AddRange(
                new IssueCategory { Name = "Pothole",       DefaultPriority = "High",   SLAHours = 48 },
                new IssueCategory { Name = "Streetlight",  DefaultPriority = "Medium", SLAHours = 72 },
                new IssueCategory { Name = "Water Leak",   DefaultPriority = "High",   SLAHours = 24 },
                new IssueCategory { Name = "Trash",        DefaultPriority = "Low",    SLAHours = 96 },
                new IssueCategory { Name = "Electricity",  DefaultPriority = "High",   SLAHours = 36 },
                new IssueCategory { Name = "Sewage",       DefaultPriority = "High",   SLAHours = 24 },
                new IssueCategory { Name = "Road Damage",  DefaultPriority = "Medium", SLAHours = 72 },
                new IssueCategory { Name = "Graffiti",     DefaultPriority = "Low",    SLAHours = 120 }
            );
            await context.SaveChangesAsync();
        }
    }
}
