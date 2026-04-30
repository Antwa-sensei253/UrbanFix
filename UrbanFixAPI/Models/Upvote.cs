using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanFixAPI.Models;

[Table("report_upvotes")]
public class Upvote
{
    [Key]
    public int Id { get; set; }

    [Column("report_id")]
    public int ReportId { get; set; }
    public Report Report { get; set; } = null!;

    [Column("user_id")]
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
