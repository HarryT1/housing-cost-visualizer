namespace backend.DTOs
{
    public class GridCellInfo
    {
        public int NewGridX { get; set; }
        public int NewGridY { get; set; }
        public double AveragePricePerSqm { get; set; }
        public int Count { get; set; }
        public double MinPricePerSqm { get; set; }
        public double MaxPricePerSqm { get; set; }
    }
}
