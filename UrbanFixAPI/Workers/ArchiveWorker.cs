using UrbanFixAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace UrbanFixAPI.Workers;

/// <summary>
/// Runs every 15 minutes and marks Resolved reports as Archived
/// if they have been resolved for more than 48 hours.
/// </summary>
public class ArchiveWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ArchiveWorker> _logger;

    public ArchiveWorker(IServiceScopeFactory scopeFactory, ILogger<ArchiveWorker> logger)
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

                var cutoff = DateTime.UtcNow.AddHours(-48);
                var toArchive = await db.Reports
                    .Where(r => r.Status == "Resolved" && r.UpdatedAt < cutoff)
                    .ToListAsync(stoppingToken);

                if (toArchive.Count > 0)
                {
                    foreach (var report in toArchive)
                    {
                        report.Status = "Archived";
                        report.UpdatedAt = DateTime.UtcNow;
                    }
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("[ArchiveWorker] Archived {Count} resolved reports.", toArchive.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ArchiveWorker] Error during archiving.");
            }

            // Wait 15 minutes before next sweep
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }
}
