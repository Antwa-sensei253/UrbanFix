using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Data;
using UrbanFixAPI.DTOs;

namespace UrbanFixAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController : BaseController
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("technicians")]
    public async Task<IActionResult> GetTechnicians()
    {
        var role = GetClaim("role");
        if (role != "DistrictManager") return Forbid();

        var distClaim = GetClaim("district_id");
        if (!int.TryParse(distClaim, out int districtId))
            return BadRequest(new { message = "DistrictManager must be assigned to a district." });

        var technicians = await _context.Users
            .Where(u => u.Role == "Technician" && u.DistrictId == districtId)
            .Select(u => new 
            {
                u.Id,
                u.FullName,
                ActiveTasks = _context.Reports.Count(r =>
                    r.TechnicianId == u.Id &&
                    r.Status != "Resolved" &&
                    r.Status != "Archived")
            })
            .OrderBy(t => t.ActiveTasks)
            .ToListAsync();

        return Ok(technicians.Select(t => new TechnicianResponse(t.Id, t.FullName, t.ActiveTasks)));
    }

    [HttpGet("technicians/suggest")]
    public async Task<IActionResult> SuggestLeastBusy()
    {
        var role = GetClaim("role");
        if (role != "DistrictManager") return Forbid();

        var distClaim = GetClaim("district_id");
        if (!int.TryParse(distClaim, out int districtId))
            return BadRequest(new { message = "DistrictManager must be assigned to a district." });

        var suggestionData = await _context.Users
            .Where(u => u.Role == "Technician" && u.DistrictId == districtId)
            .Select(u => new 
            {
                u.Id,
                u.FullName,
                ActiveTasks = _context.Reports.Count(r =>
                    r.TechnicianId == u.Id &&
                    r.Status != "Resolved" &&
                    r.Status != "Archived")
            })
            .OrderBy(t => t.ActiveTasks)
            .FirstOrDefaultAsync();

        if (suggestionData == null) return NotFound(new { message = "No technician available." });
        return Ok(new TechnicianResponse(suggestionData.Id, suggestionData.FullName, suggestionData.ActiveTasks));
    }
}
