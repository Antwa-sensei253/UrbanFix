using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Data;
using UrbanFixAPI.DTOs;

namespace UrbanFixAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public class NotificationsController : BaseController
{
    private readonly AppDbContext _context;

    public NotificationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var userIdStr = GetClaim("user_id");
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = int.Parse(userIdStr);
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationResponse(n.Id, n.Message, n.IsRead, n.CreatedAt))
            .ToListAsync();

        return Ok(notifications);
    }
}
