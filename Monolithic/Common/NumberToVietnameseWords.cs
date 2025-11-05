namespace Monolithic.Common
{
    /// <summary>
    /// Utility ?? chuy?n ??i s? thành ch? ti?ng Vi?t
    /// </summary>
    public static class NumberToVietnameseWords
    {
        private static readonly string[] NumberWords = { "không", "m?t", "hai", "ba", "b?n", "n?m", "sáu", "b?y", "tám", "chín" };
        private static readonly string[] UnitWords = { "", "m??i", "tr?m", "nghìn", "m??i", "tr?m", "tri?u", "m??i", "tr?m", "t?" };

        /// <summary>
        /// Chuy?n ??i s? ti?n (decimal) thành ch? ti?ng Vi?t
        /// </summary>
        /// <param name="number">S? ti?n c?n chuy?n ??i</param>
        /// <param name="addCurrency">Có thêm ??n v? ti?n t? "??ng" không</param>
        /// <returns>Chu?i s? thành ch? ti?ng Vi?t</returns>
        public static string ConvertToWords(decimal number, bool addCurrency = true)
        {
            if (number == 0)
                return addCurrency ? "Không ??ng" : "Không";

            if (number < 0)
                return "S? âm không h?p l?";

            // Chuy?n sang s? nguyên (b? ph?n th?p phân n?u có)
            long integerPart = (long)number;
            
            string words = ConvertIntegerToWords(integerPart);
            
            if (addCurrency)
                words += " ??ng";

            // Vi?t hoa ch? cái ??u
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
                        // Thêm ??n v?: nghìn, tri?u, t?
                        if (unitIndex == 3)
                            threeDigitWords += " nghìn";
                        else if (unitIndex == 6)
                            threeDigitWords += " tri?u";
                        else if (unitIndex == 9)
                            threeDigitWords += " t?";
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

            // Hàng tr?m
            int hundreds = number / 100;
            if (hundreds > 0)
            {
                words = NumberWords[hundreds] + " tr?m";
                number %= 100;
            }

            // Hàng ch?c
            if (number >= 10)
            {
                int tens = number / 10;
                if (!string.IsNullOrEmpty(words))
                    words += " ";
                
                if (tens == 1)
                    words += "m??i";
                else
                    words += NumberWords[tens] + " m??i";
                
                number %= 10;
            }
            else if (number > 0 && hundreds > 0)
            {
                // Tr??ng h?p 101, 102... 109
                words += " l?";
            }

            // Hàng ??n v?
            if (number > 0)
            {
                if (!string.IsNullOrEmpty(words))
                    words += " ";

                // X? lý tr??ng h?p ??c bi?t "m??i m?t" -> "m??i m?t", không ph?i "m??i m?t"
                // Và "hai m??i m?t" -> "hai m??i m?t"
                if (number == 1 && words.EndsWith("m??i"))
                    words += "m?t";
                else if (number == 5 && words.EndsWith("m??i"))
                    words += "l?m";
                else if (number == 1 && words.EndsWith("m??i"))
                    words += "m?t";
                else
                    words += NumberWords[number];
            }

            return words;
        }

        /// <summary>
        /// Chuy?n ??i s? ti?n có ph?n th?p phân (VD: 1234567.50 ??ng)
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
