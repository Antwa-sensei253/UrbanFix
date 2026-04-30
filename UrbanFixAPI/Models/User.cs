using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanFixAPI.Models;

[Table("users")]
public class User
{
    [Key]
    public int Id { get; set; }

    [Column("full_name")]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Column("national_id")]
    [MaxLength(50)]
    public string NationalId { get; set; } = string.Empty;

    [Column("password_hash")]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(20)]
    public string Role { get; set; } = string.Empty;

    [Column("district_id")]
    public int? DistrictId { get; set; }

    [Column("otp_code")]
    [MaxLength(10)]
    public string? OtpCode { get; set; }

    [Column("otp_expiry")]
    public DateTime? OtpExpiry { get; set; }

    [Column("is_verified")]
    public bool IsVerified { get; set; } = false;

    // Navigation
    [ForeignKey("DistrictId")]
    public District? District { get; set; }
}
