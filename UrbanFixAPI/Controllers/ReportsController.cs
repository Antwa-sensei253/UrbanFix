using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Data;
using UrbanFixAPI.DTOs;
using UrbanFixAPI.Models;

namespace UrbanFixAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportsController : BaseController
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }


    private ReportResponse MapToResponse(Report r, int upvoteCount = 0, bool hasUpvoted = false) => new ReportResponse(
        r.Id,
        r.CitizenId,
        r.Citizen?.FullName ?? "Unknown",
        r.Category,
        r.Urgency,
        r.Latitude,
        r.Longitude,
        r.AddressDescription,
        r.PhotoUrl,
        r.Description,
        r.Status,
        r.TechnicianId,
        r.Technician?.FullName,
        r.RejectionReason,
        r.IsPublic,
        r.CreatedAt,
        r.UpdatedAt,
        upvoteCount,
        hasUpvoted
    );

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportRequest request)
    {
        if (GetClaim("role") != "Citizen") return Forbid();
        if (string.IsNullOrWhiteSpace(request.PhotoUrl) && string.IsNullOrWhiteSpace(request.PhotoBase64))
            return BadRequest(new { message = "Before photo is mandatory. Provide either photo_url or photo_base64." });

        var citizenId = int.Parse(GetClaim("user_id"));

        // ── Duplicate prevention: 50-metre radius ──────────────────────
        var newLat = (double)(request.Latitude ?? 30.0444m);
        var newLng = (double)(request.Longitude ?? 31.2357m);

        var activeStatuses = new[] { "Reported", "Verified", "Assigned", "In Progress" };
        var nearby = await _context.Reports
            .Where(r => r.Category == request.Category && activeStatuses.Contains(r.Status))
            .Select(r => new { r.Id, Lat = (double)r.Latitude, Lng = (double)r.Longitude })
            .ToListAsync();

        var duplicate = nearby.FirstOrDefault(r => HaversineMeters(newLat, newLng, r.Lat, r.Lng) <= 50);
        if (duplicate != null)
            return Conflict(new { message = "An issue has already been reported here. Do you want to follow the existing report instead?", existing_id = duplicate.Id });
        // ──────────────────────────────────────────────────────────────

        var report = new Report
        {
            CitizenId = citizenId,
            Category = request.Category,
            Urgency = request.Urgency,
            AddressDescription = request.AddressDescription,
            PhotoUrl = !string.IsNullOrWhiteSpace(request.PhotoUrl) ? request.PhotoUrl : request.PhotoBase64,
            Description = request.Description,
            Status = "Reported",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            // Use provided coordinates, or fallback to a randomized jitter offset around Cairo
            Latitude = request.Latitude ?? (30.0444m + (decimal)(Random.Shared.NextDouble() * 0.04 - 0.02)),
            Longitude = request.Longitude ?? (31.2357m + (decimal)(Random.Shared.NextDouble() * 0.04 - 0.02))
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        // Load navigation for mapping
        var saved = await _context.Reports.Include(r => r.Citizen).FirstAsync(r => r.Id == report.Id);
        return CreatedAtAction(nameof(Create), new { id = report.Id }, MapToResponse(saved));
    }

    /// <summary>Haversine formula — returns distance in metres.</summary>
    private static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6_371_000; // Earth radius in metres
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180)
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var role = GetClaim("role");
        var userId = int.Parse(GetClaim("user_id"));

        IQueryable<Report> query = _context.Reports
            .Include(r => r.Citizen)
            .Include(r => r.Technician);

        if (role == "Citizen")
        {
            // Citizens see public reports or their own
            query = query.Where(r => r.IsPublic || r.CitizenId == userId);
        }
        else if (role == "DistrictManager")
        {
            var distClaim = GetClaim("district_id");
            if (int.TryParse(distClaim, out int districtId))
            {
                query = query.Where(r => r.Citizen.DistrictId == districtId);
            }
            else
            {
                return Ok(new List<ReportResponse>()); // No district, no reports
            }
        }
        else if (role == "Technician")
        {
            var distClaim = GetClaim("district_id");
            if (int.TryParse(distClaim, out int districtId))
            {
                query = query.Where(r => r.Citizen.DistrictId == districtId);
            }
            else
            {
                return Ok(new List<ReportResponse>());
            }
        }
        // Technicians and Governors see all (filtered as needed by role in frontend or separate calls)

        var results = await query.ToListAsync();
        return Ok(results.Select(r => MapToResponse(r)));
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        if (GetClaim("role") != "Citizen") return Forbid();

        var citizenId = int.Parse(GetClaim("user_id"));
        var results = await _context.Reports
            .Include(r => r.Citizen)
            .Include(r => r.Technician)
            .Where(r => r.CitizenId == citizenId)
            .ToListAsync();

        return Ok(results.Select(r => MapToResponse(r)));
    }

    [HttpGet("{id}/track-map")]
    public async Task<IActionResult> GetTrackMap(int id)
    {
        var role = GetClaim("role");
        var userId = int.Parse(GetClaim("user_id"));

        var report = await _context.Reports
            .Include(r => r.Citizen)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();

        if (role == "Citizen" && report.CitizenId != userId) return Forbid();
        if (role == "Technician" && report.TechnicianId != userId) return Forbid();
        if (role == "DistrictManager")
        {
            if (!int.TryParse(GetClaim("district_id"), out int districtId) || report.Citizen.DistrictId != districtId)
                return Forbid();
        }

        var stagesOrder = new List<string> { "Reported", "Verified", "Assigned", "InProgress", "Resolved" };
        var normalizedStatus = report.Status == "In Progress" ? "InProgress" : report.Status;
        var currentIndex = stagesOrder.IndexOf(normalizedStatus);
        if (currentIndex < 0) currentIndex = 0;

        var stages = stagesOrder
            .Select((stage, index) => new TrackMapStageResponse(
                stage,
                index <= currentIndex,
                index == currentIndex
            ))
            .ToList();

        return Ok(new TrackMapResponse(
            report.Id,
            report.Latitude,
            report.Longitude,
            report.Status,
            stages
        ));
    }

    [HttpGet("situation-room")]
    public async Task<IActionResult> GetSituationRoom(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? category,
        [FromQuery] int? technicianId)
    {
        var role = GetClaim("role");
        if (role is not ("DistrictManager" or "Governor")) return Forbid();

        var query = _context.Reports
            .Include(r => r.Citizen)
            .Include(r => r.Technician)
            .AsQueryable();

        if (role == "DistrictManager" && int.TryParse(GetClaim("district_id"), out int districtId))
        {
            query = query.Where(r => r.Citizen.DistrictId == districtId);
        }

        // Situation room is focused on pending work.
        query = query.Where(r => r.Status != "Resolved" && r.Status != "Archived");

        if (fromDate.HasValue)
        {
            query = query.Where(r => r.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(r => r.CreatedAt <= toDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(r => r.Category == category);
        }

        if (technicianId.HasValue)
        {
            query = query.Where(r => r.TechnicianId == technicianId.Value);
        }

        var rows = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new SituationRoomRowResponse(
                r.Id,
                r.CreatedAt,
                r.Category,
                r.Status,
                r.Urgency,
                r.Citizen.FullName,
                r.TechnicianId,
                r.Technician != null ? r.Technician.FullName : null
            ))
            .ToListAsync();

        return Ok(rows);
    }

    [HttpGet("maintenance-logs")]
    public async Task<IActionResult> GetMaintenanceLogs(
        [FromQuery] string? category,
        [FromQuery] string? addressContains,
        [FromQuery] int lookbackHours = 24)
    {
        var role = GetClaim("role");
        if (role is not ("DistrictManager" or "Governor")) return Forbid();

        if (lookbackHours <= 0) lookbackHours = 24;
        var cutoff = DateTime.UtcNow.AddHours(-lookbackHours);

        var query = _context.Reports
            .Include(r => r.Citizen)
            .Include(r => r.Technician)
            .Where(r => r.Status == "Resolved" && r.UpdatedAt >= cutoff);

        if (role == "DistrictManager" && int.TryParse(GetClaim("district_id"), out int districtId))
        {
            query = query.Where(r => r.Citizen.DistrictId == districtId);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(r => r.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(addressContains))
        {
            query = query.Where(r => r.AddressDescription != null && r.AddressDescription.Contains(addressContains));
        }

        var logs = await query
            .OrderByDescending(r => r.UpdatedAt)
            .Select(r => new MaintenanceLogRowResponse(
                r.Id,
                r.Category,
                r.Status,
                r.AddressDescription,
                r.UpdatedAt,
                r.Technician != null ? r.Technician.FullName : null
            ))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPatch("{id}/verify")]
    public async Task<IActionResult> Verify(int id, [FromBody] VerifyReportRequest request)
    {
        if (GetClaim("role") != "DistrictManager") return Forbid();

        var report = await _context.Reports.Include(r => r.Citizen).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();

        if (request.IsApproved)
        {
            report.Status = "Verified";
            if (!string.IsNullOrEmpty(request.Category))
            {
                report.Category = request.Category;
            }
            if (request.IsPublic.HasValue)
            {
                report.IsPublic = request.IsPublic.Value;
            }

            _context.Notifications.Add(new Notification
            {
                UserId = report.CitizenId,
                Message = $"Your report #{id} has been approved and is {(report.IsPublic ? "now public" : "under review")}.",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
                return BadRequest(new { message = "Rejection reason is required." });

            report.Status = "Rejected";
            report.RejectionReason = request.RejectionReason;
            report.IsPublic = false; // Never public if rejected
            _context.Notifications.Add(new Notification
            {
                UserId = report.CitizenId,
                Message = $"Your report #{id} was rejected as redundant. Reason: {request.RejectionReason}",
                CreatedAt = DateTime.UtcNow
            });
        }

        report.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(report));
    }

    [HttpPatch("{id}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignReportRequest request)
    {
        if (GetClaim("role") != "DistrictManager") return Forbid();
        if (request.TechnicianId <= 0) return BadRequest(new { message = "Invalid technician id." });

        if (!int.TryParse(GetClaim("district_id"), out int districtId))
            return BadRequest(new { message = "DistrictManager must be assigned to a district." });

        var report = await _context.Reports.Include(r => r.Citizen).Include(r => r.Technician).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();
        if (report.Citizen.DistrictId != districtId)
            return Forbid();

        var technician = await _context.Users.FirstOrDefaultAsync(u =>
            u.Id == request.TechnicianId &&
            u.Role == "Technician" &&
            u.DistrictId == districtId);
        if (technician == null)
            return BadRequest(new { message = "Technician not found in your district." });

        report.TechnicianId = request.TechnicianId;
        report.Status = "Assigned";
        report.UpdatedAt = DateTime.UtcNow;

        _context.Notifications.Add(new Notification
        {
            UserId = request.TechnicianId,
            Message = report.Urgency == "Critical"
                ? "New critical task assigned in your area."
                : $"New task assigned: {report.Category} at {report.AddressDescription}.",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        
        // Re-load technician for response
        var updated = await _context.Reports.Include(r => r.Citizen).Include(r => r.Technician).FirstAsync(r => r.Id == id);
        return Ok(MapToResponse(updated));
    }

    [HttpPost("delegation/reassign")]
    public async Task<IActionResult> ReassignPendingTasks([FromBody] DelegationRequest request)
    {
        if (GetClaim("role") != "DistrictManager") return Forbid();

        var distClaim = GetClaim("district_id");
        if (!int.TryParse(distClaim, out int districtId))
            return BadRequest(new { message = "DistrictManager must be assigned to a district." });

        if (request.UntilUtc <= DateTime.UtcNow)
            return BadRequest(new { message = "Delegation end time must be in the future." });

        var fromTech = await _context.Users.FirstOrDefaultAsync(u =>
            u.Id == request.FromTechnicianId && u.Role == "Technician" && u.DistrictId == districtId);
        var toTech = await _context.Users.FirstOrDefaultAsync(u =>
            u.Id == request.ToTechnicianId && u.Role == "Technician" && u.DistrictId == districtId);
        if (fromTech == null || toTech == null)
            return BadRequest(new { message = "Technicians must belong to your district." });

        var pending = await _context.Reports
            .Where(r =>
                r.TechnicianId == request.FromTechnicianId &&
                (r.Status == "Assigned" || r.Status == "InProgress" || r.Status == "In Progress"))
            .ToListAsync();

        foreach (var report in pending)
        {
            report.TechnicianId = request.ToTechnicianId;
            report.UpdatedAt = DateTime.UtcNow;
        }

        _context.Notifications.Add(new Notification
        {
            UserId = request.ToTechnicianId,
            Message = $"Delegation active until {request.UntilUtc:u}. You received {pending.Count} reassigned pending task(s).",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { reassigned_count = pending.Count, delegated_until = request.UntilUtc });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        if (GetClaim("role") != "Technician") return Forbid();

        var report = await _context.Reports.Include(r => r.Citizen).FirstOrDefaultAsync(r => r.Id == id);
        if (report == null) return NotFound();

        if (request.NewStatus == "Resolved" && string.IsNullOrEmpty(request.PhotoUrl))
        {
            return BadRequest(new { message = "A proof photo URL is required to resolve a report." });
        }

        report.Status = request.NewStatus;
        if (!string.IsNullOrEmpty(request.PhotoUrl))
        {
            report.PhotoUrl = request.PhotoUrl;
        }
        report.UpdatedAt = DateTime.UtcNow;

        string msg = request.NewStatus == "InProgress" 
            ? $"Work has started on your report #{id}!" 
            : $"Thank you! Your issue #{id} has been resolved.";

        _context.Notifications.Add(new Notification
        {
            UserId = report.CitizenId,
            Message = msg,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(MapToResponse(report));
    }

    // ─────────────────────────────────────────────
    // Community Feed
    // ─────────────────────────────────────────────

    /// <summary>
    /// Returns public reports for the calling citizen's district,
    /// annotated with upvote count and whether the caller has upvoted.
    /// </summary>
    [HttpGet("community")]
    public async Task<IActionResult> GetCommunity()
    {
        if (GetClaim("role") != "Citizen") return Forbid();
        var userId = int.Parse(GetClaim("user_id"));

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        // All public reports in the same district, newest first
        var reports = await _context.Reports
            .Where(r => r.IsPublic && r.Citizen != null && r.Citizen.DistrictId == user.DistrictId)
            .Include(r => r.Citizen)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var reportIds = reports.Select(r => r.Id).ToList();

        // Upvote counts per report
        var upvoteCounts = await _context.Upvotes
            .Where(u => reportIds.Contains(u.ReportId))
            .GroupBy(u => u.ReportId)
            .Select(g => new { ReportId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReportId, x => x.Count);

        // Which ones the current user already upvoted
        var upvotedByMe = await _context.Upvotes
            .Where(u => u.UserId == userId && reportIds.Contains(u.ReportId))
            .Select(u => u.ReportId)
            .ToHashSetAsync();

        var result = reports.Select(r => MapToResponse(
            r,
            upvoteCounts.GetValueOrDefault(r.Id, 0),
            upvotedByMe.Contains(r.Id)
        ));

        return Ok(result);
    }

    // ─────────────────────────────────────────────
    // Liked / Upvoted Reports Feed
    // ─────────────────────────────────────────────

    /// <summary>
    /// Returns reports that the currently authenticated citizen has liked/upvoted.
    /// </summary>
    [HttpGet("upvoted")]
    [HttpGet("liked")]
    public async Task<IActionResult> GetUpvoted()
    {
        if (GetClaim("role") != "Citizen") return Forbid();
        var userId = int.Parse(GetClaim("user_id"));

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var upvotedReportIds = await _context.Upvotes
            .Where(u => u.UserId == userId)
            .Select(u => u.ReportId)
            .ToListAsync();

        var reports = await _context.Reports
            .Where(r => upvotedReportIds.Contains(r.Id) && r.IsPublic)
            .Include(r => r.Citizen)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var reportIds = reports.Select(r => r.Id).ToList();

        var upvoteCounts = await _context.Upvotes
            .Where(u => reportIds.Contains(u.ReportId))
            .GroupBy(u => u.ReportId)
            .Select(g => new { ReportId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReportId, x => x.Count);

        var result = reports.Select(r => MapToResponse(
            r,
            upvoteCounts.GetValueOrDefault(r.Id, 0),
            true
        ));

        return Ok(result);
    }

    // ─────────────────────────────────────────────
    // Toggle Upvote
    // ─────────────────────────────────────────────

    /// <summary>
    /// Toggles an upvote for a report by the calling citizen.
    /// Returns the new upvote count and whether the user now has an upvote.
    /// </summary>
    [HttpPost("{id}/upvote")]
    public async Task<IActionResult> ToggleUpvote(int id)
    {
        if (GetClaim("role") != "Citizen") return Forbid();
        var userId = int.Parse(GetClaim("user_id"));

        var report = await _context.Reports.FindAsync(id);
        if (report == null) return NotFound(new { message = "Report not found." });
        if (!report.IsPublic) return BadRequest(new { message = "Cannot upvote a private report." });

        var existing = await _context.Upvotes
            .FirstOrDefaultAsync(u => u.ReportId == id && u.UserId == userId);

        bool hasUpvoted;
        if (existing != null)
        {
            _context.Upvotes.Remove(existing);
            hasUpvoted = false;
        }
        else
        {
            _context.Upvotes.Add(new Upvote { ReportId = id, UserId = userId });
            hasUpvoted = true;
        }

        await _context.SaveChangesAsync();

        var count = await _context.Upvotes.CountAsync(u => u.ReportId == id);
        return Ok(new { upvote_count = count, has_upvoted = hasUpvoted });
    }
}
