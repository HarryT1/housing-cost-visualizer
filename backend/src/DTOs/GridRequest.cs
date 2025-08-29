namespace backend.DTOs
{
    public class GridRequestDto
    {
        public int CellScale { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }
}