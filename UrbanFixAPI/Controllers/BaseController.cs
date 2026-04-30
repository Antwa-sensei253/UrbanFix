using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace UrbanFixAPI.Controllers;

public abstract class BaseController : ControllerBase
{
    protected string GetClaim(string type)
    {
        // Try exact match, then standard ClaimTypes match
        var claim = User.Claims.FirstOrDefault(c => c.Type.Equals(type, StringComparison.OrdinalIgnoreCase));
        
        if (claim == null && type.Equals("role", StringComparison.OrdinalIgnoreCase))
            claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role"));
            
        if (claim == null && type.Equals("user_id", StringComparison.OrdinalIgnoreCase))
            claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type.EndsWith("/nameidentifier"));

        if (claim == null && type.Equals("district_id", StringComparison.OrdinalIgnoreCase))
            claim = User.Claims.FirstOrDefault(c => c.Type.EndsWith("/district_id"));

        var val = claim?.Value ?? string.Empty;
        Console.WriteLine($"[DEBUG] Claim '{type}' requested. Found: '{val}'");
        return val;
    }
}
