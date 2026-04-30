using Microsoft.EntityFrameworkCore;
using UrbanFixAPI.Data;
using UrbanFixAPI.Helpers;
using UrbanFixAPI.Models;

namespace UrbanFixAPI.Workers;

/// <summary>
/// Sends the governor a daily executive summary at 08:00 server local time.
/// </summary>
public class DailyExecutiveSummaryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DailyExecutiveSummaryWorker> _logger;
    private DateOnly? _lastSentDate;

    public DailyExecutiveSummaryWorker(IServiceScopeFactory scopeFactory, ILogger<DailyExecutiveSummaryWorker> logger)
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
                var now = DateTime.Now;
                var today = DateOnly.FromDateTime(now);

                if (now.Hour >= 8 && _lastSentDate != today)
                {
                    await SendSummariesAsync(stoppingToken);
                    _lastSentDate = today;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DailyExecutiveSummaryWorker] Error while sending summary.");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task SendSummariesAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();

        var since = DateTime.UtcNow.AddHours(-24);
        var nowUtc = DateTime.UtcNow;

        var newReportsCount = await db.Reports
            .CountAsync(r => r.CreatedAt >= since, stoppingToken);

        var resolvedCount = await db.Reports
            .CountAsync(r => r.Status == "Resolved" && r.UpdatedAt >= since, stoppingToken);

        var delayedDistricts = await db.Reports
            .Include(r => r.Citizen)
            .Where(r => r.Status != "Resolved")
            .GroupBy(r => r.Citizen.DistrictId)
            .Select(g => new
            {
                DistrictId = g.Key,
                AvgDelayHours = g.Average(x => EF.Functions.DateDiffMinute(x.CreatedAt, nowUtc) / 60.0)
            })
            .OrderByDescending(x => x.AvgDelayHours)
            .Take(3)
            .ToListAsync(stoppingToken);

        var districtIds = delayedDistricts
            .Where(d => d.DistrictId.HasValue)
            .Select(d => d.DistrictId!.Value)
            .ToList();

        var districtNames = await db.Districts
            .Where(d => districtIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.Name, stoppingToken);

        var delayedLines = delayedDistricts.Any()
            ? string.Join(Environment.NewLine, delayedDistricts.Select(d =>
                {
                    var name = d.DistrictId.HasValue && districtNames.ContainsKey(d.DistrictId.Value)
                        ? districtNames[d.DistrictId.Value]
                        : "Unknown District";
                    return $"- {name}: {Math.Round(d.AvgDelayHours, 1)}h avg open delay";
                }))
            : "- No delayed districts.";

        var body =
            "UrbanFix Daily Executive Summary (last 24h)" + Environment.NewLine +
            $"1) Total new reports: {newReportsCount}" + Environment.NewLine +
            $"2) Resolved issues: {resolvedCount}" + Environment.NewLine +
            "3) Districts with highest delay in resolution:" + Environment.NewLine +
            delayedLines;

        var governors = await db.Users
            .Where(u => u.Role == "Governor" && u.Email != null)
            .ToListAsync(stoppingToken);

        foreach (var governor in governors)
        {
            await emailService.SendExecutiveSummaryAsync(governor.Email!, governor.FullName, body);
            db.Notifications.Add(new Notification
            {
                UserId = governor.Id,
                Message = "Daily Executive Summary sent at 08:00.",
                CreatedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync(stoppingToken);
        _logger.LogInformation("[DailyExecutiveSummaryWorker] Sent summaries to {Count} governor(s).", governors.Count);
    }
}
