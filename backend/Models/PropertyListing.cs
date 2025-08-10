namespace backend.Models;

public class PropertyListing
{
    public int Id { get; set; }
    public DateTime SaleDate { get; set; }
    public string? Municipality { get; set; }
    public string? Neighborhood { get; set; }
    public string? Address { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? SaleType { get; set; }
    public int? Price { get; set; }
    public double? AreaSqm { get; set; }
    public double? Rooms { get; set; }
    public double? Floor { get; set; }

    public int GridX { get; set; }
    public int GridY { get; set; }

}