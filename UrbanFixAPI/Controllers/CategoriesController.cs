using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using UrbanFixAPI.Data;
using UrbanFixAPI.Models;

namespace UrbanFixAPI.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : BaseController
{
    private readonly AppDbContext _context;
    public CategoriesController(AppDbContext context) => _context = context;

    // ── Public list ──────────────────────────────────────────────────────────
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var cats = await _context.IssueCategories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse(c.Id, c.Name, c.DefaultPriority, c.SLAHours))
            .ToListAsync();
        return Ok(cats);
    }

    // ── Governor: create ─────────────────────────────────────────────────────
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest req)
    {
        if (GetClaim("role") != "Governor") return Forbid();
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { message = "Name is required." });

        var validPriorities = new[] { "High", "Medium", "Low" };
        var priority = validPriorities.Contains(req.DefaultPriority) ? req.DefaultPriority : "Medium";

        var cat = new IssueCategory
        {
            Name = req.Name.Trim(),
            DefaultPriority = priority,
            SLAHours = req.SLAHours > 0 ? req.SLAHours : 72,
        };
        _context.IssueCategories.Add(cat);
        await _context.SaveChangesAsync();
        return Ok(new CategoryResponse(cat.Id, cat.Name, cat.DefaultPriority, cat.SLAHours));
    }

    // ── Governor: delete ─────────────────────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        if (GetClaim("role") != "Governor") return Forbid();
        var cat = await _context.IssueCategories.FindAsync(id);
        if (cat == null) return NotFound(new { message = "Category not found." });
        _context.IssueCategories.Remove(cat);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Category deleted." });
    }
}

public record CategoryResponse(
    int Id,
    string Name,
    [property: JsonPropertyName("default_priority")] string DefaultPriority,
    [property: JsonPropertyName("sla_hours")] int SLAHours
);

public record CreateCategoryRequest(
    string Name,
    [property: JsonPropertyName("default_priority")] string DefaultPriority,
    [property: JsonPropertyName("sla_hours")] int SLAHours
);
