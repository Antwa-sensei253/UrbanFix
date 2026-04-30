using System.Text.Json.Serialization;

namespace UrbanFixAPI.DTOs;

public record CreateReportRequest(
    string Category,
    string Urgency,
    [property: JsonPropertyName("address_description")] string? AddressDescription,
    decimal? Latitude,
    decimal? Longitude,
    [property: JsonPropertyName("photo_url")] string? PhotoUrl,
    [property: JsonPropertyName("photo_base64")] string? PhotoBase64,
    string Description
);

public record ReportResponse(
    int Id,
    [property: JsonPropertyName("citizen_id")] int CitizenId,
    [property: JsonPropertyName("citizen_name")] string CitizenName,
    string Category,
    string Urgency,
    decimal Latitude,
    decimal Longitude,
    [property: JsonPropertyName("address_description")] string? AddressDescription,
    [property: JsonPropertyName("photo_url")] string? PhotoUrl,
    string Description,
    string Status,
    [property: JsonPropertyName("technician_id")] int? TechnicianId,
    [property: JsonPropertyName("technician_name")] string? TechnicianName,
    [property: JsonPropertyName("rejection_reason")] string? RejectionReason,
    [property: JsonPropertyName("is_public")] bool IsPublic,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt,
    [property: JsonPropertyName("updated_at")] DateTime UpdatedAt,
    [property: JsonPropertyName("upvote_count")] int UpvoteCount = 0,
    [property: JsonPropertyName("has_upvoted")] bool HasUpvoted = false
);

/// <summary>Lightweight DTO used for the public community feed.</summary>
public record CommunityReportResponse(
    int Id,
    string Category,
    string Urgency,
    string Status,
    [property: JsonPropertyName("address_description")] string? AddressDescription,
    [property: JsonPropertyName("photo_url")] string? PhotoUrl,
    string? Description,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt,
    [property: JsonPropertyName("upvote_count")] int UpvoteCount,
    [property: JsonPropertyName("has_upvoted")] bool HasUpvoted
);

public record VerifyReportRequest(
    [property: JsonPropertyName("is_approved")] bool IsApproved,
    [property: JsonPropertyName("rejection_reason")] string? RejectionReason,
    [property: JsonPropertyName("category")] string? Category,
    [property: JsonPropertyName("is_public")] bool? IsPublic
);

public record AssignReportRequest(
    [property: JsonPropertyName("technician_id")] int TechnicianId
);

public record UpdateStatusRequest(
    [property: JsonPropertyName("new_status")] string NewStatus,
    [property: JsonPropertyName("photo_url")] string? PhotoUrl
);

public record TrackMapStageResponse(
    string Status,
    [property: JsonPropertyName("is_completed")] bool IsCompleted,
    [property: JsonPropertyName("is_current")] bool IsCurrent
);

public record TrackMapResponse(
    [property: JsonPropertyName("report_id")] int ReportId,
    decimal Latitude,
    decimal Longitude,
    string Status,
    [property: JsonPropertyName("stages")] List<TrackMapStageResponse> Stages
);

public record SituationRoomRowResponse(
    [property: JsonPropertyName("report_id")] int ReportId,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt,
    string Category,
    string Status,
    string Urgency,
    [property: JsonPropertyName("citizen_name")] string CitizenName,
    [property: JsonPropertyName("technician_id")] int? TechnicianId,
    [property: JsonPropertyName("technician_name")] string? TechnicianName
);

public record MaintenanceLogRowResponse(
    [property: JsonPropertyName("report_id")] int ReportId,
    string Category,
    string Status,
    [property: JsonPropertyName("address_description")] string? AddressDescription,
    [property: JsonPropertyName("updated_at")] DateTime UpdatedAt,
    [property: JsonPropertyName("technician_name")] string? TechnicianName
);

public record DelegationRequest(
    [property: JsonPropertyName("from_technician_id")] int FromTechnicianId,
    [property: JsonPropertyName("to_technician_id")] int ToTechnicianId,
    [property: JsonPropertyName("until_utc")] DateTime UntilUtc
);
