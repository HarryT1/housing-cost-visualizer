using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;


namespace backend.Controllers;

[ApiController]
[Route("[controller]")]
public class PropertyListingController : ControllerBase
{

    private readonly ILogger<PropertyListingController> _logger;
    private readonly AppDbContext _context;
    private readonly GeometryFactory _geometryFactory;

    public PropertyListingController(ILogger<PropertyListingController> logger, AppDbContext context)
    {
        _logger = logger;
        _context = context;
        _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
    }

    [HttpGet("AvgSqmPriceByMunicipality")]
    public async Task<ActionResult<Dictionary<string, double>>> GetProperties()
    {
        var averages = await _context.Properties
        .Where(p => p.Price.HasValue && p.AreaSqm.HasValue && p.AreaSqm.Value > 0 && p.SaleType == "Slutpris")
        .GroupBy(p => p.Municipality)
        .Select(g => new
        {
            Municipality = g.Key,
            AveragePricePerSqm = g.Average(p => p.Price.Value / p.AreaSqm.Value)
        })
        .ToDictionaryAsync(g => g.Municipality, g => g.AveragePricePerSqm);
        return Ok(averages);
    }


    [HttpGet("BoundingBox")]
    public async Task<ActionResult<Dictionary<string, double>>> GetBoundingBox()
    {
        var query = _context.Properties
        .Where(p => p.Latitude.HasValue && p.Longitude.HasValue);

        var minLat = await query.MinAsync(p => p.Latitude.Value);
        var minLng = await query.MinAsync(p => p.Longitude.Value);
        var maxLat = await query.MaxAsync(p => p.Latitude.Value);
        var maxLng = await query.MaxAsync(p => p.Longitude.Value);

        var bbox = new Dictionary<string, double>
        {
            { "minLat", minLat },
            { "minLng", minLng },
            { "maxLat", maxLat },
            { "maxLng", maxLng }
        };

        return Ok(bbox);

    }

    [HttpGet("Polygon")]
    public async Task<IActionResult> GetConvexHullPolygon()
    {
        // Chatgpt-generated sql-query to get a convex polygon from the lat/long data points that exist in the db
        var result = await _context.Database
        .SqlQueryRaw<string>(@"
            SELECT ST_AsGeoJSON(
                ST_ConvexHull(
                    ST_Collect(ST_SetSRID(ST_MakePoint(Longitude, Latitude), 4326))
                )
            ) AS ""Value""
            FROM apartment_sales
            WHERE Longitude IS NOT NULL AND Latitude IS NOT NULL
        ")
        .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(result))
            return NotFound("No polygon could be generated.");

        return Content(result, "application/json");
    }


}
