using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Data;
using UrbanFixAPI.DTOs;
using UrbanFixAPI.Models;

namespace UrbanFixAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/admin")]
public class AdminController : BaseController
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (GetClaim("role") != "Governor") return Forbid();

        var users = await _context.Users
            .Include(u => u.District)
            .Select(u => new UserManagementResponse(
                u.Id,
                u.FullName,
                u.NationalId,
                u.Role,
                u.DistrictId,
                u.District != null ? u.District.Name : null,
                u.IsVerified
            ))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPatch("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request)
    {
        if (GetClaim("role") != "Governor") return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Role = request.Role;
        user.DistrictId = request.DistrictId;
        
        await _context.SaveChangesAsync();
        return Ok(new { message = $"User {user.FullName} updated to {request.Role}." });
    }

    [HttpGet("districts")]
    public async Task<IActionResult> GetDistricts()
    {
        if (GetClaim("role") != "Governor") return Forbid();
        var districts = await _context.Districts.ToListAsync();
        return Ok(districts);
    }

    [HttpPost("districts")]
    public async Task<IActionResult> CreateDistrict([FromBody] string name)
    {
        if (GetClaim("role") != "Governor") return Forbid();
        var district = new District { Name = name };
        _context.Districts.Add(district);
        await _context.SaveChangesAsync();
        return Ok(district);
    }
}
