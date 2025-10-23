using System.Text.Json;
using System.Text.Json.Serialization;

namespace Monolithic.Common
{
    /// <summary>
    /// Custom JSON converter for DateTime that formats to "yyyy-MM-dd HH:mm" (without seconds)
    /// This ensures frontend compatibility by removing seconds and milliseconds from datetime values
    /// </summary>
    public class DateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                string dateTimeString = reader.GetString() ?? string.Empty;
                
                // Try to parse the datetime string
                if (DateTime.TryParse(dateTimeString, out DateTime result))
                {
                    return result;
                }
            }
            
            throw new JsonException($"Unable to convert \"{reader.GetString()}\" to DateTime.");
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            // Format as "yyyy-MM-dd HH:mm" (without seconds and milliseconds)
            writer.WriteStringValue(value.ToString("yyyy-MM-dd HH:mm"));
        }
    }

    /// <summary>
    /// Custom JSON converter for nullable DateTime that formats to "yyyy-MM-dd HH:mm" (without seconds)
    /// </summary>
    public class NullableDateTimeConverter : JsonConverter<DateTime?>
    {
        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                string dateTimeString = reader.GetString() ?? string.Empty;
                
                if (string.IsNullOrEmpty(dateTimeString))
                {
                    return null;
                }
                
                // Try to parse the datetime string
                if (DateTime.TryParse(dateTimeString, out DateTime result))
                {
                    return result;
                }
            }
            
            throw new JsonException($"Unable to convert \"{reader.GetString()}\" to DateTime?.");
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
            {
                // Format as "yyyy-MM-dd HH:mm" (without seconds and milliseconds)
                writer.WriteStringValue(value.Value.ToString("yyyy-MM-dd HH:mm"));
            }
            else
            {
                writer.WriteNullValue();
            }
        }
    }
}
