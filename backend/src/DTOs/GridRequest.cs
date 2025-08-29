namespace backend.DTOs
{
    public class GridRequestDto
    {
        public int CellScale { get; set; }
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
    }
}