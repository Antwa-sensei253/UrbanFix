using System.Text.Json.Serialization;

namespace UrbanFixAPI.DTOs;

public record TechnicianResponse(
    int Id,
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("active_tasks")] int ActiveTasks = 0
);
