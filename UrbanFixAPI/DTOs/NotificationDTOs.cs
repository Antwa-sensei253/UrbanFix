using System.Text.Json.Serialization;

namespace UrbanFixAPI.DTOs;

public record NotificationResponse(
    int Id,
    string Message,
    [property: JsonPropertyName("is_read")] bool IsRead,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt
);
