using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Services;
using backend.DTOs;


namespace backend.Controllers;

[ApiController]
[Route("[controller]")]
public class PropertyListingController : ControllerBase
{

    private readonly ILogger<PropertyListingController> _logger;
    private readonly PropertyListingService _propertyListingService;



    public PropertyListingController(ILogger<PropertyListingController> logger, PropertyListingService propertyListingService)
    {
        _logger = logger;
        _propertyListingService = propertyListingService;
    }

    [HttpGet("AvgSqmPriceByMunicipality")]
    public async Task<ActionResult<Dictionary<string, double>>> GetAvgSqmPriceByMunicipality()
    {
        var averages = await _propertyListingService.GetAvgSqmPriceByMunicipalityAsync();
        return Ok(averages);
    }


    [HttpGet("BoundingBox")]
    public async Task<ActionResult<Dictionary<string, double>>> GetBoundingBox()
    {
        var boundingBox = await _propertyListingService.GetBoundingBoxAsync();

        return Ok(boundingBox);

    }

    [HttpGet("Polygon")]
    public async Task<IActionResult> GetConvexHullPolygon()
    {

        var polygon = await _propertyListingService.GetConvexHullPolygonAsync();

        if (string.IsNullOrEmpty(polygon))
            return NotFound("No polygon could be generated.");

        return Content(polygon, "application/json");
    }


    [HttpPost("GridSqmPrices")]
    // Cellscale determines the resulting grid cell sizes, the smallest possible grid cells 
    // come with cellScale = 1 with grids of 100mx100m and cellScale = 5 results in 500mx500m grid cells etc.
    public async Task<ActionResult<List<GridCellInfo>>> GridSqmPrices([FromBody] int cellScale)
    {

        if (cellScale <= 0 || cellScale > 20)
        {
            return BadRequest("cellScale must be an integer between the values 1 and 20.");
        }

        var gridInfo = await _propertyListingService.GetGridCellInfoAsync(cellScale);

        return Ok(gridInfo);
    }


}
