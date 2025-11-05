namespace Monolithic.Common
{
    /// <summary>
    /// Utility để chuyển đổi số thành chữ tiếng Việt
    /// </summary>
    public static class NumberToVietnameseWords
    {
        private static readonly string[] NumberWords = { "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín" };
        private static readonly string[] UnitWords = { "", "mươi", "trăm", "nghìn", "mươi", "trăm", "triệu", "mươi", "trăm", "tỷ" };

        /// <summary>
        /// Chuyển đổi số tiền (decimal) thành chữ tiếng Việt
        /// </summary>
        /// <param name="number">Số tiền cần chuyển đổi</param>
        /// <param name="addCurrency">Có thêm đơn vị tiền tệ "đồng" không</param>
        /// <returns>Chuỗi số thành chữ tiếng Việt</returns>
        public static string ConvertToWords(decimal number, bool addCurrency = true)
        {
            if (number == 0)
                return addCurrency ? "Không đồng" : "Không";

            if (number < 0)
                return "Số âm không hợp lệ";

            // Chuyển sang số nguyên (bỏ phần thập phân nếu có)
            long integerPart = (long)number;
            
            string words = ConvertIntegerToWords(integerPart);
            
            if (addCurrency)
                words += " đồng";

            // Viết hoa chữ cái đầu
            if (!string.IsNullOrEmpty(words))
                words = char.ToUpper(words[0]) + words.Substring(1);

            return words;
        }

        private static string ConvertIntegerToWords(long number)
        {
            if (number == 0)
                return "không";

            string words = "";
            int unitIndex = 0;

            while (number > 0)
            {
                int threeDigits = (int)(number % 1000);
                if (threeDigits > 0)
                {
                    string threeDigitWords = ConvertThreeDigitsToWords(threeDigits);
                    
                    if (unitIndex > 0)
                    {
                        // Thêm đơn vị: nghìn, triệu, tỷ
                        if (unitIndex == 3)
                            threeDigitWords += " nghìn";
                        else if (unitIndex == 6)
                            threeDigitWords += " triệu";
                        else if (unitIndex == 9)
                            threeDigitWords += " tỷ";
                    }
                    
                    words = threeDigitWords + (string.IsNullOrEmpty(words) ? "" : " " + words);
                }

                number /= 1000;
                unitIndex += 3;
            }

            return words.Trim();
        }

        private static string ConvertThreeDigitsToWords(int number)
        {
            if (number == 0)
                return "";

            string words = "";

            // Hàng trăm
            int hundreds = number / 100;
            if (hundreds > 0)
            {
                words = NumberWords[hundreds] + " trăm";
                number %= 100;
            }

            // Hàng chục
            if (number >= 10)
            {
                int tens = number / 10;
                if (!string.IsNullOrEmpty(words))
                    words += " ";
                
                if (tens == 1)
                    words += "mười";
                else
                    words += NumberWords[tens] + " mươi";
                
                number %= 10;
            }
            else if (number > 0 && hundreds > 0)
            {
                // Trường hợp 101, 102... 109
                words += " lẻ";
            }

            // Hàng đơn vị
            if (number > 0)
            {
                if (!string.IsNullOrEmpty(words))
                    words += " ";

                // Xử lý trường hợp đặc biệt "mười một" -> "mười một", không phải "mười một"
                // Và "hai mươi một" -> "hai mươi mốt"
                if (number == 1 && words.EndsWith("mươi"))
                    words += "mốt";
                else if (number == 5 && words.EndsWith("mươi"))
                    words += "lăm";
                else if (number == 1 && words.EndsWith("lẻ"))
                    words += "một";
                else
                    words += NumberWords[number];
            }

            return words;
        }

        /// <summary>
        /// Chuyển đổi số tiền có phần thập phân (VD: 1234567.50 đồng)
        /// </summary>
        public static string ConvertMoneyToWords(decimal amount)
        {
            long integerPart = (long)amount;
            int decimalPart = (int)((amount - integerPart) * 100);

            string words = ConvertToWords(integerPart, true);

            if (decimalPart > 0)
            {
                words += " " + ConvertIntegerToWords(decimalPart) + " xu";
            }

            return words;
        }
    }
}
