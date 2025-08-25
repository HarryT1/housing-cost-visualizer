using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.DTOs;


namespace backend.Services
{
    public class PropertyListingService
    {
        private readonly AppDbContext _context;

        public PropertyListingService(AppDbContext context)
        {
            _context = context;
        }


        public async Task<Dictionary<string, double>> GetAvgSqmPriceByMunicipalityAsync()
        {
            return await _context.Properties
            .Where(p => p.Price.HasValue && p.AreaSqm.HasValue && p.AreaSqm.Value > 0 && p.SaleType == "Slutpris")
            .GroupBy(p => p.Municipality)
            .Select(g => new
            {
                Municipality = g.Key,
                AveragePricePerSqm = g.Average(p => p.Price.Value / p.AreaSqm.Value)
            })
            .ToDictionaryAsync(g => g.Municipality, g => g.AveragePricePerSqm);
        }

        public async Task<Dictionary<string, double>> GetBoundingBoxAsync()
        {
            var query = _context.Properties;

            var minLat = await query.MinAsync(p => p.Latitude);
            var minLng = await query.MinAsync(p => p.Longitude);
            var maxLat = await query.MaxAsync(p => p.Latitude);
            var maxLng = await query.MaxAsync(p => p.Longitude);

            return new Dictionary<string, double>
        {
            { "minLat", minLat },
            { "minLng", minLng },
            { "maxLat", maxLat },
            { "maxLng", maxLng }
        };

        }

        public async Task<string?> GetConvexHullPolygonAsync()
        {
            // Chatgpt-generated sql-query to get a convex polygon from the lat/long data points that exist in the db
            return await _context.Database
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
        }

        public async Task<List<GridCellInfo>> GetGridCellInfoAsync(int cellScale)
        {
            return await _context.Properties
                .Where(p => p.Price.HasValue && p.AreaSqm.HasValue && p.AreaSqm.Value > 0 && (p.SaleType == "Slutpris" || p.SaleType == "Lagfart"))
                .GroupBy(p => new { NewGridX = p.GridX / cellScale, NewGridY = p.GridY / cellScale })
                .Select(g => new GridCellInfo
                {
                    NewGridX = g.Key.NewGridX,
                    NewGridY = g.Key.NewGridY,
                    AveragePricePerSqm = g.Average(p => p.Price.Value / p.AreaSqm.Value),
                    Count = g.Count(),
                    MinPricePerSqm = g.Min(p => p.Price.Value / p.AreaSqm.Value),
                    MaxPricePerSqm = g.Max(p => p.Price.Value / p.AreaSqm.Value)
                })
            .ToListAsync();
        }

    }
}

