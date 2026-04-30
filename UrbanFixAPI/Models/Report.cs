using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanFixAPI.Models;

[Table("reports")]
public class Report
{
    [Key]
    public int Id { get; set; }

    [Column("citizen_id")]
    public int CitizenId { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Urgency { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,7)")]
    public decimal Latitude { get; set; }

    [Column(TypeName = "decimal(10,7)")]
    public decimal Longitude { get; set; }

    [Column("address_description")]
    [MaxLength(255)]
    public string? AddressDescription { get; set; }

    [Column("photo_url", TypeName = "text")]
    public string? PhotoUrl { get; set; }

    [Column(TypeName = "text")]
    public string Description { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "Reported";

    [Column("is_public")]
    public bool IsPublic { get; set; } = false;

    [Column("estimated_cost", TypeName = "decimal(18,2)")]
    public decimal EstimatedCost { get; set; } = 0;

    [Column("technician_id")]
    public int? TechnicianId { get; set; }

    [Column("rejection_reason")]
    [MaxLength(255)]
    public string? RejectionReason { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation
    [ForeignKey("CitizenId")]
    public User Citizen { get; set; } = null!;

    [ForeignKey("TechnicianId")]
    public User? Technician { get; set; }
}
