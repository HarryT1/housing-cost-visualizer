using Microsoft.EntityFrameworkCore;

namespace backend.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PropertyListing>()
            .ToTable("apartment_sales");
    }
    public DbSet<PropertyListing> Properties { get; set; }
}