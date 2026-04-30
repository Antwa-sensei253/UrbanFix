using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanFixAPI.Models;

[Table("notifications")]
public class Notification
{
    [Key]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [MaxLength(255)]
    public string Message { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
