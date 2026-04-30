using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanFixAPI.Models;

public class IssueCategory
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>High | Medium | Low</summary>
    [MaxLength(20)]
    public string DefaultPriority { get; set; } = "Medium";

    /// <summary>Default SLA hours for resolution</summary>
    [Column("sla_hours")]
    public int SLAHours { get; set; } = 72;
}
