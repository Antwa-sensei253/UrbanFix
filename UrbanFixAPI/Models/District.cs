using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanFixAPI.Models;

[Table("districts")]
public class District
{
    [Key]
    public int Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column("budget_limit", TypeName = "decimal(18,2)")]
    public decimal BudgetLimit { get; set; } = 1000000;
}
