namespace Monolithic.DTOs.Common
{
    public class ResponseDto<T>
    {
        public bool IsSuccess { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new();

        public static ResponseDto<T> Success(T data, string message = "")
        {
            return new ResponseDto<T>
            {
                IsSuccess = true,
                Data = data,
                Message = message
            };
        }

        public static ResponseDto<T> Failure(string error, string message = "")
        {
            return new ResponseDto<T>
            {
                IsSuccess = false,
                Message = message,
                Errors = new List<string> { error }
            };
        }

        public static ResponseDto<T> Failure(List<string> errors, string message = "")
        {
            return new ResponseDto<T>
            {
                IsSuccess = false,
                Message = message,
                Errors = errors
            };
        }
    }

    public class PaginationDto<T>
    {
        public List<T> Data { get; set; } = new();
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public bool HasPrevious { get; set; }
        public bool HasNext { get; set; }

        public PaginationDto(List<T> data, int page, int pageSize, int totalItems)
        {
            Data = data;
            CurrentPage = page;
            PageSize = pageSize;
            TotalItems = totalItems;
            TotalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            HasPrevious = page > 1;
            HasNext = page < TotalPages;
        }
    }

    public class PaginationRequestDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string Search { get; set; } = string.Empty;
        public string SortBy { get; set; } = string.Empty;
        public bool SortDesc { get; set; } = false;
    }
}