using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Data;
using UrbanFixAPI.DTOs;

namespace UrbanFixAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/analytics")]
public class AnalyticsController : BaseController
{
    private readonly AppDbContext _context;

    public AnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var role = GetClaim("role");
        if (role != "Governor") return Forbid();

        var reports = await _context.Reports.Include(r => r.Citizen).ToListAsync();
        var districts = await _context.Districts.ToListAsync();

        var total = reports.Count;
        var resolved = reports.Count(r => r.Status == "Resolved");
        var inProgress = reports.Count(r => r.Status == "InProgress");
        var critical = reports.Count(r => r.Urgency == "Critical" && r.Status != "Resolved");
        
        var totalSpent = reports.Where(r => r.Status == "Resolved").Sum(r => r.EstimatedCost);
        var totalBudget = districts.Sum(d => d.BudgetLimit);

        var categories = new[] { "Pothole", "Streetlight", "Water Leak", "Trash" };
        var byCategory = categories.ToDictionary(
            cat => cat,
            cat => reports.Count(r => r.Category == cat)
        );

        var rankings = districts.Select(d => {
            var districtReports = reports.Where(r => r.Citizen.DistrictId == d.Id).ToList();
            var resCount = districtReports.Count(r => r.Status == "Resolved");
            var rate = districtReports.Any() ? (double)resCount / districtReports.Count * 100 : 0;
            var spent = districtReports.Where(r => r.Status == "Resolved").Sum(r => r.EstimatedCost);
            
            return new DistrictRanking(d.Name, Math.Round(rate, 1), spent, d.BudgetLimit);
        }).OrderByDescending(r => r.ResolutionRate).ToList();

        return Ok(new AnalyticsSummaryResponse(
            total, 
            resolved, 
            inProgress, 
            critical, 
            totalSpent, 
            totalBudget, 
            byCategory, 
            rankings
        ));
    }

    [HttpGet("heatmap")]
    public async Task<IActionResult> GetHeatmap()
    {
        var role = GetClaim("role");
        if (role is not ("DistrictManager" or "Governor")) return Forbid();

        var query = _context.Reports.AsQueryable();
        if (role == "DistrictManager" && int.TryParse(GetClaim("district_id"), out int districtId))
        {
            query = query.Where(r => r.Citizen.DistrictId == districtId);
        }

        var pins = await query
            .Include(r => r.Citizen)
            .Select(r => new HeatmapPinResponse(
                r.Id,
                r.Latitude,
                r.Longitude,
                r.Category,
                r.Status,
                r.Status == "Resolved" ? "Green"
                    : (r.Status == "InProgress" || r.Status == "In Progress" || r.Status == "Assigned" || r.Status == "Verified")
                        ? "Yellow"
                        : "Red"
            ))
            .ToListAsync();

        return Ok(pins);
    }

    [HttpGet("panel")]
    public async Task<IActionResult> GetPanel()
    {
        var role = GetClaim("role");
        if (role is not ("DistrictManager" or "Governor")) return Forbid();

        var query = _context.Reports.AsQueryable();
        if (role == "DistrictManager" && int.TryParse(GetClaim("district_id"), out int districtId))
        {
            query = query.Where(r => r.Citizen.DistrictId == districtId);
        }

        var reports = await query
            .Include(r => r.Citizen)
            .ToListAsync();

        var resolved = reports
            .Where(r => r.Status == "Resolved" && r.UpdatedAt >= r.CreatedAt)
            .ToList();

        var averageResolutionHours = resolved.Any()
            ? Math.Round(resolved.Average(r => (r.UpdatedAt - r.CreatedAt).TotalHours), 2)
            : 0;

        var topCategories = reports
            .GroupBy(r => r.Category)
            .Select(g => new TopCategoryResponse(g.Key, g.Count()))
            .OrderByDescending(g => g.Count)
            .Take(5)
            .ToList();

        return Ok(new AnalyticsPanelResponse(averageResolutionHours, topCategories));
    }

    [HttpGet("sla-breaches")]
    public async Task<IActionResult> GetSlaBreaches()
    {
        var role = GetClaim("role");
        if (role is not ("DistrictManager" or "Governor")) return Forbid();

        var cutoff = DateTime.UtcNow.AddMinutes(-30);
        var query = _context.Reports
            .Where(r =>
                r.Urgency == "Critical" &&
                (r.Status == "Reported" || r.Status == "Verified") &&
                r.TechnicianId == null &&
                r.CreatedAt < cutoff);

        if (role == "DistrictManager" && int.TryParse(GetClaim("district_id"), out int districtId))
        {
            query = query.Where(r => r.Citizen.DistrictId == districtId);
        }

        var breaches = await query
            .Include(r => r.Citizen)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new SlaBreachAlertResponse(
                r.Id,
                r.Category,
                r.AddressDescription,
                r.CreatedAt,
                (int)Math.Round((DateTime.UtcNow - r.CreatedAt).TotalMinutes)
            ))
            .ToListAsync();

        return Ok(breaches);
    }
}
