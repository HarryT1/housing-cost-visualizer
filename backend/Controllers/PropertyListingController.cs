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

    public PropertyListingController(ILogger<PropertyListingController> logger, AppDbContext context)
    {
        _logger = logger;
        _context = context;
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


}
