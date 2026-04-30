using System.Text.Json.Serialization;

namespace UrbanFixAPI.DTOs;

public record LoginRequest(
    [property: JsonPropertyName("national_id")] string NationalId,
    string Password
);

public record LoginResponse(
    string Token,
    string Role,
    [property: JsonPropertyName("user_id")] int UserId,
    [property: JsonPropertyName("full_name")] string FullName
);

public record RegisterRequest(
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("national_id")] string NationalId,
    string Password,
    string Email,
    string Role,
    [property: JsonPropertyName("district_id")] int? DistrictId
);

public record VerifyOtpRequest(
    [property: JsonPropertyName("national_id")] string NationalId,
    string Otp
);

public record UserManagementResponse(
    int Id,
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("national_id")] string NationalId,
    string Role,
    [property: JsonPropertyName("district_id")] int? DistrictId,
    [property: JsonPropertyName("district_name")] string? DistrictName,
    [property: JsonPropertyName("is_verified")] bool IsVerified
);

public record UpdateUserRoleRequest(
    string Role,
    [property: JsonPropertyName("district_id")] int? DistrictId
);
