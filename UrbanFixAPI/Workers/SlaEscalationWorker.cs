using UrbanFixAPI.Data;
using UrbanFixAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace UrbanFixAPI.Workers;

/// <summary>
/// Sends:
/// 1) 4-hour High-priority not-started alerts to District Managers.
/// 2) 30-minute Critical unassigned service-level breach alerts to Governors.
/// Runs every 10 minutes.
/// </summary>
public class SlaEscalationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlaEscalationWorker> _logger;

    public SlaEscalationWorker(IServiceScopeFactory scopeFactory, ILogger<SlaEscalationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var highPriorityCutoff = DateTime.UtcNow.AddHours(-4);
                var criticalCutoff = DateTime.UtcNow.AddMinutes(-30);

                var alerts = new List<Notification>();

                // High-priority SLA (4h): assigned but not picked up by technician.
                var highPriorityOverdue = await db.Reports
                    .Where(r =>
                        r.Urgency == "High" &&
                        r.Status == "Assigned" &&
                        r.UpdatedAt < highPriorityCutoff)
                    .ToListAsync(stoppingToken);

                if (highPriorityOverdue.Count > 0)
                {
                    var managerIds = await db.Users
                        .Where(u => u.Role == "DistrictManager")
                        .Select(u => u.Id)
                        .ToListAsync(stoppingToken);

                    foreach (var report in highPriorityOverdue)
                    {
                        foreach (var managerId in managerIds)
                        {
                            var recentAlert = await db.Notifications.AnyAsync(n =>
                                n.UserId == managerId &&
                                n.Message.Contains($"#{report.Id}") &&
                                n.CreatedAt > DateTime.UtcNow.AddMinutes(-30),
                                stoppingToken);

                            if (!recentAlert)
                            {
                                alerts.Add(new Notification
                                {
                                    UserId = managerId,
                                    Message = $"Escalation Alert: High-priority report #{report.Id} has not been picked up within 4 hours.",
                                    CreatedAt = DateTime.UtcNow
                                });
                            }
                        }
                    }
                }

                // Critical breach (30m): still unassigned.
                var criticalOverdue = await db.Reports
                    .Where(r =>
                        r.Urgency == "Critical" &&
                        (r.Status == "Reported" || r.Status == "Verified") &&
                        r.TechnicianId == null &&
                        r.CreatedAt < criticalCutoff)
                    .ToListAsync(stoppingToken);

                if (criticalOverdue.Count > 0)
                {
                    var governorIds = await db.Users
                        .Where(u => u.Role == "Governor")
                        .Select(u => u.Id)
                        .ToListAsync(stoppingToken);

                    foreach (var report in criticalOverdue)
                    {
                        foreach (var governorId in governorIds)
                        {
                            var recentAlert = await db.Notifications.AnyAsync(n =>
                                n.UserId == governorId &&
                                n.Message.Contains($"#{report.Id}") &&
                                n.CreatedAt > DateTime.UtcNow.AddMinutes(-30),
                                stoppingToken);

                            if (!recentAlert)
                            {
                                alerts.Add(new Notification
                                {
                                    UserId = governorId,
                                    Message = $"Service Level Breach: Critical report #{report.Id} has not been assigned within 30 minutes.",
                                    CreatedAt = DateTime.UtcNow
                                });
                            }
                        }
                    }

                }

                if (alerts.Count > 0)
                {
                    db.Notifications.AddRange(alerts);
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("[SlaEscalationWorker] Sent {Count} escalation alerts.", alerts.Count);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SlaEscalationWorker] REAL EXCEPTION: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }

            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }
}
