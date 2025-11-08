using System.Text.Json.Serialization;

namespace Monolithic.Models
{
    public class ForecastDto
    {
        // Thuộc tính [JsonPropertyName] giúp C#
        // "ánh xạ" JSON (viết thường) sang thuộc tính C# (viết hoa)

        [JsonPropertyName("ds")]
        public string Date { get; set; }

        [JsonPropertyName("yhat")]
        public int PredictedCount { get; set; } // yhat là số dự báo (đã làm tròn)

        [JsonPropertyName("yhat_lower")]
        public int LowerBound { get; set; } // Giới hạn dưới

        [JsonPropertyName("yhat_upper")]
        public int UpperBound { get; set; } // Giới hạn trên
    }
}
