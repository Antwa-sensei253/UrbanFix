using System.Text.Json.Serialization;

namespace UrbanFixAPI.DTOs;

public record DistrictRanking(
    [property: JsonPropertyName("district_name")] string DistrictName,
    [property: JsonPropertyName("resolution_rate")] double ResolutionRate,
    [property: JsonPropertyName("total_spent")] decimal TotalSpent,
    [property: JsonPropertyName("budget_limit")] decimal BudgetLimit
);

public record AnalyticsSummaryResponse(
    int Total,
    int Resolved,
    [property: JsonPropertyName("in_progress")] int InProgress,
    int Critical,
    [property: JsonPropertyName("total_spent")] decimal TotalSpent,
    [property: JsonPropertyName("total_budget")] decimal TotalBudget,
    [property: JsonPropertyName("by_category")] Dictionary<string, int> ByCategory,
    [property: JsonPropertyName("district_rankings")] List<DistrictRanking> DistrictRankings
);

public record HeatmapPinResponse(
    [property: JsonPropertyName("report_id")] int ReportId,
    decimal Latitude,
    decimal Longitude,
    string Category,
    string Status,
    string Color
);

public record TopCategoryResponse(
    string Category,
    int Count
);

public record AnalyticsPanelResponse(
    [property: JsonPropertyName("average_resolution_hours")] double AverageResolutionHours,
    [property: JsonPropertyName("top_reported_categories")] List<TopCategoryResponse> TopReportedCategories
);

public record SlaBreachAlertResponse(
    [property: JsonPropertyName("report_id")] int ReportId,
    string Category,
    [property: JsonPropertyName("address_description")] string? AddressDescription,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt,
    [property: JsonPropertyName("age_minutes")] int AgeMinutes
);
