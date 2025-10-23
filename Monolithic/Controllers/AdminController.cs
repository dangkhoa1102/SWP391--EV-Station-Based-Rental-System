using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Monolithic.Common;
using Monolithic.DTOs.Common;
using Monolithic.Services.Interfaces;

namespace Monolithic.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = AppRoles.Admin)]
    public class AdminController : ControllerBase
    {
        private readonly ICarService _carService;
        private readonly IStationService _stationService;
        private readonly IBookingService _bookingService;
        private readonly IUserService _userService;

        public AdminController(
            ICarService carService,
            IStationService stationService,
            IBookingService bookingService,
            IUserService userService)
        {
            _carService = carService;
            _stationService = stationService;
            _bookingService = bookingService;
            _userService = userService;
        }

        #region Fleet & Station Management (Quản lý đội xe & điểm thuê)

        /// <summary>
        /// Giám sát số lượng xe ở từng điểm (tổng quan)
        /// </summary>
        [HttpGet("Fleet/Overview")]
        public async Task<ActionResult<ResponseDto<object>>> GetFleetOverview()
        {
            try
            {
                // Lấy danh sách tất cả các trạm
                var stationsResult = await _stationService.GetStationsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 1000 
                });

                if (!stationsResult.IsSuccess)
                {
                    return BadRequest(stationsResult);
                }

                var overview = new List<object>();

                foreach (var station in stationsResult.Data!.Data)
                {
                    var carsAtStation = await _carService.GetAvailableCarsAsync(station.Id);
                    
                    overview.Add(new
                    {
                        StationId = station.Id,
                        StationName = station.Name,
                        Address = station.Address,
                        TotalSlots = station.TotalSlots,
                        AvailableSlots = station.AvailableSlots,
                        TotalCars = carsAtStation.Data?.Count ?? 0,
                        AvailableCars = carsAtStation.Data?.Count(c => c.IsAvailable) ?? 0,
                        InUseCars = carsAtStation.Data?.Count(c => !c.IsAvailable) ?? 0,
                        IsActive = station.IsActive
                    });
                }

                return Ok(ResponseDto<object>.Success(overview, "Lấy tổng quan đội xe thành công"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Theo dõi lịch sử giao/nhận xe theo station
        /// </summary>
        [HttpGet("Fleet/History/Station/{stationId}")]
        public async Task<ActionResult<ResponseDto<object>>> GetStationCarHistory(
            Guid stationId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                // TODO: Implement detailed car history tracking
                // For now, return booking history for the station
                var result = new
                {
                    StationId = stationId,
                    FromDate = fromDate ?? DateTime.UtcNow.AddDays(-30),
                    ToDate = toDate ?? DateTime.UtcNow,
                    Message = "Feature in development - Sẽ hiển thị lịch sử check-in/check-out tại trạm này"
                };

                return Ok(ResponseDto<object>.Success(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Theo dõi tình trạng xe chi tiết
        /// </summary>
        [HttpGet("Fleet/Car-Status")]
        public async Task<ActionResult<ResponseDto<object>>> GetCarStatusReport(
            [FromQuery] Guid? stationId = null,
            [FromQuery] string? status = null)
        {
            try
            {
                var allCarsResult = await _carService.GetCarsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 1000 
                });

                if (!allCarsResult.IsSuccess)
                {
                    return BadRequest(allCarsResult);
                }

                var cars = allCarsResult.Data!.Data;

                // Filter by station if provided
                if (stationId.HasValue)
                {
                    cars = cars.Where(c => c.CurrentStationId == stationId.Value).ToList();
                }

                var report = new
                {
                    TotalCars = cars.Count,
                    ActiveCars = cars.Count(c => c.IsActive),
                    InactiveCars = cars.Count(c => !c.IsActive),
                    AvailableCars = cars.Count(c => c.IsAvailable && c.IsActive),
                    InUseCars = cars.Count(c => !c.IsAvailable && c.IsActive),
                    LowBatteryCars = cars.Count(c => c.CurrentBatteryLevel < 20),
                    ByStation = cars.GroupBy(c => c.CurrentStationName)
                        .Select(g => new
                        {
                            StationName = g.Key,
                            TotalCars = g.Count(),
                            AvailableCars = g.Count(c => c.IsAvailable),
                            LowBattery = g.Count(c => c.CurrentBatteryLevel < 20)
                        })
                        .OrderByDescending(x => x.TotalCars)
                        .ToList(),
                    Cars = cars
                };

                return Ok(ResponseDto<object>.Success(report, "Báo cáo tình trạng xe"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Điều phối xe giữa các trạm (yêu cầu di chuyển xe)
        /// </summary>
        [HttpPost("Fleet/Transfer-Car")]
        public async Task<ActionResult<ResponseDto<string>>> TransferCarBetweenStations(
            [FromQuery] Guid carId,
            [FromQuery] Guid targetStationId,
            [FromQuery] string? reason = null)
        {
            try
            {
                var result = await _carService.UpdateCarLocationAsync(carId, targetStationId);
                
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(ResponseDto<string>.Success(
                    $"Đã chuyển xe đến trạm mới. Lý do: {reason ?? "Điều phối thường xuyên"}", 
                    "Điều phối xe thành công"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<string>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        #endregion

        #region Customer Management (Quản lý khách hàng)

        /// <summary>
        /// Lấy hồ sơ khách hàng chi tiết
        /// </summary>
        [HttpGet("Customers/{userId}/Profile")]
        public async Task<ActionResult<ResponseDto<object>>> GetCustomerProfile(string userId)
        {
            try
            {
                var userResult = await _userService.FindByIdAsync(userId);
                if (userResult == null)
                {
                    return NotFound(ResponseDto<object>.Failure("Không tìm thấy khách hàng"));
                }

                var bookingHistory = await _bookingService.GetUserBookingsAsync(userId);

                var profile = new
                {
                    User = userResult,
                    TotalBookings = bookingHistory.Data?.Count ?? 0,
                    CompletedBookings = bookingHistory.Data?.Count(b => b.BookingStatus == Models.BookingStatus.Completed) ?? 0,
                    CancelledBookings = bookingHistory.Data?.Count(b => b.BookingStatus == Models.BookingStatus.Cancelled) ?? 0,
                    TotalSpent = bookingHistory.Data?.Where(b => b.BookingStatus == Models.BookingStatus.Completed)
                        .Sum(b => b.TotalAmount) ?? 0,
                    RecentBookings = bookingHistory.Data?.OrderByDescending(b => b.CreatedAt).Take(5).ToList()
                };

                return Ok(ResponseDto<object>.Success(profile, "Lấy hồ sơ khách hàng thành công"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy danh sách khách hàng có rủi ro (vi phạm, hư hỏng)
        /// </summary>
        [HttpGet("Customers/Risk-List")]
        public async Task<ActionResult<ResponseDto<object>>> GetRiskCustomers(
            [FromQuery] int minCancellations = 3,
            [FromQuery] decimal minDamageFee = 500000)
        {
            try
            {
                // Get all users
                var usersResult = await _userService.GetUsersAsync(1, 1000, null, AppRoles.EVRenter, true);
                
                if (!usersResult.Item1.Any())
                {
                    return Ok(ResponseDto<object>.Success(new List<object>(), "Không có khách hàng rủi ro"));
                }

                var riskCustomers = new List<object>();

                foreach (var user in usersResult.Item1)
                {
                    var bookings = await _bookingService.GetUserBookingsAsync(user.UserId.ToString());
                    var userBookings = bookings.Data ?? new List<DTOs.Booking.BookingDto>();

                    var cancelledCount = userBookings.Count(b => b.BookingStatus == Models.BookingStatus.Cancelled);
                    var totalDamageFees = 0m; // TODO: Calculate from actual damage fees in bookings

                    // Mark as risk if meets criteria
                    if (cancelledCount >= minCancellations || totalDamageFees >= minDamageFee)
                    {
                        riskCustomers.Add(new
                        {
                            UserId = user.UserId,
                            FullName = $"{user.FirstName} {user.LastName}",
                            Email = user.Email,
                            PhoneNumber = user.PhoneNumber,
                            TotalBookings = userBookings.Count,
                            CancelledBookings = cancelledCount,
                            CancellationRate = userBookings.Count > 0 
                                ? Math.Round((decimal)cancelledCount / userBookings.Count * 100, 2) 
                                : 0,
                            TotalDamageFees = totalDamageFees,
                            RiskLevel = cancelledCount >= 5 ? "HIGH" : 
                                       cancelledCount >= 3 ? "MEDIUM" : "LOW",
                            LastBookingDate = userBookings.OrderByDescending(b => b.CreatedAt).FirstOrDefault()?.CreatedAt
                        });
                    }
                }

                var orderedRiskCustomers = riskCustomers
                    .OrderByDescending(c => ((dynamic)c).CancelledBookings)
                    .ThenByDescending(c => ((dynamic)c).TotalDamageFees)
                    .ToList();

                return Ok(ResponseDto<object>.Success(orderedRiskCustomers, 
                    $"Tìm thấy {riskCustomers.Count} khách hàng có rủi ro"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy danh sách khiếu nại từ khách hàng
        /// </summary>
        [HttpGet("Customers/Complaints")]
        public async Task<ActionResult<ResponseDto<object>>> GetCustomerComplaints(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                // TODO: Implement complaints/feedback system integration
                var result = new
                {
                    Message = "Feature in development - Tích hợp với Feedback API",
                    SuggestedEndpoint = "/api/Feedback/Get-All"
                };

                return Ok(ResponseDto<object>.Success(result));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        #endregion

        #region Staff Management (Quản lý nhân viên)

        /// <summary>
        /// Lấy danh sách nhân viên theo trạm
        /// </summary>
        [HttpGet("Staff/By-Station/{stationId}")]
        public async Task<ActionResult<ResponseDto<object>>> GetStaffByStation(Guid stationId)
        {
            try
            {
                // Get all staff members (Station Staff role)
                var staffResult = await _userService.GetUsersAsync(1, 1000, null, AppRoles.StationStaff, true);
                
                // TODO: Add station assignment to User model to filter by station
                // For now, return all staff
                var staffList = staffResult.Item1.Select(s => new
                {
                    UserId = s.UserId,
                    FullName = $"{s.FirstName} {s.LastName}",
                    Email = s.Email,
                    PhoneNumber = s.PhoneNumber,
                    Role = s.UserRole,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt
                }).ToList();

                return Ok(ResponseDto<object>.Success(staffList, 
                    $"Tìm thấy {staffList.Count} nhân viên"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Theo dõi hiệu suất nhân viên
        /// </summary>
        [HttpGet("Staff/{staffId}/Performance")]
        public async Task<ActionResult<ResponseDto<object>>> GetStaffPerformance(
            string staffId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var staff = await _userService.FindByIdAsync(staffId);
                if (staff == null)
                {
                    return NotFound(ResponseDto<object>.Failure("Không tìm thấy nhân viên"));
                }

                // TODO: Track staff actions in check-in/check-out
                // For now, return sample data structure
                var performance = new
                {
                    StaffId = staffId,
                    StaffName = $"{staff.FirstName} {staff.LastName}",
                    Period = new
                    {
                        From = fromDate ?? DateTime.UtcNow.AddDays(-30),
                        To = toDate ?? DateTime.UtcNow
                    },
                    Metrics = new
                    {
                        TotalCheckIns = 0,  // TODO: Count from bookings
                        TotalCheckOuts = 0, // TODO: Count from bookings
                        AverageProcessingTime = 0, // TODO: Calculate average time
                        CustomerSatisfactionRate = 0.0, // TODO: From feedback
                        ComplaintsReceived = 0 // TODO: From complaints
                    },
                    Message = "Feature in development - Cần tracking staff actions trong booking flow"
                };

                return Ok(ResponseDto<object>.Success(performance, "Báo cáo hiệu suất nhân viên"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy tổng quan hiệu suất tất cả nhân viên
        /// </summary>
        [HttpGet("Staff/Performance-Overview")]
        public async Task<ActionResult<ResponseDto<object>>> GetAllStaffPerformance(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var staffResult = await _userService.GetUsersAsync(1, 1000, null, AppRoles.StationStaff, true);
                
                var overview = staffResult.Item1.Select(s => new
                {
                    StaffId = s.UserId,
                    StaffName = $"{s.FirstName} {s.LastName}",
                    Email = s.Email,
                    TotalCheckIns = 0,  // TODO: Implement tracking
                    TotalCheckOuts = 0,
                    SatisfactionRate = 0.0,
                    Status = s.IsActive ? "Active" : "Inactive"
                }).OrderByDescending(s => s.TotalCheckIns).ToList();

                return Ok(ResponseDto<object>.Success(overview, 
                    $"Tổng quan {overview.Count} nhân viên"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        #endregion

        #region Dashboard & Statistics (Thống kê tổng quan)

        /// <summary>
        /// Lấy dashboard tổng quan cho Admin
        /// </summary>
        [HttpGet("Dashboard")]
        public async Task<ActionResult<ResponseDto<object>>> GetAdminDashboard()
        {
            try
            {
                // Get statistics
                var totalUsers = await _userService.GetTotalUsersCountAsync();
                var usersByRole = await _userService.GetUserStatisticsByRoleAsync();
                
                var carsResult = await _carService.GetCarsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 1000 
                });
                
                var bookingsResult = await _bookingService.GetBookingsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 1000 
                });

                var dashboard = new
                {
                    Overview = new
                    {
                        TotalUsers = totalUsers,
                        TotalCars = carsResult.Data?.TotalItems ?? 0,
                        TotalBookings = bookingsResult.Data?.TotalItems ?? 0,
                        ActiveBookings = bookingsResult.Data?.Data.Count(b => 
                            b.BookingStatus == Models.BookingStatus.CheckedIn) ?? 0
                    },
                    UserStatistics = new
                    {
                        ByRole = usersByRole,
                        TotalActive = totalUsers
                    },
                    FleetStatistics = new
                    {
                        TotalCars = carsResult.Data?.TotalItems ?? 0,
                        AvailableCars = carsResult.Data?.Data.Count(c => c.IsAvailable) ?? 0,
                        InUseCars = carsResult.Data?.Data.Count(c => !c.IsAvailable) ?? 0,
                        LowBatteryCars = carsResult.Data?.Data.Count(c => c.CurrentBatteryLevel < 20) ?? 0
                    },
                    BookingStatistics = new
                    {
                        Total = bookingsResult.Data?.TotalItems ?? 0,
                        Pending = bookingsResult.Data?.Data.Count(b => b.BookingStatus == Models.BookingStatus.Pending) ?? 0,
                        Confirmed = bookingsResult.Data?.Data.Count(b => b.BookingStatus == Models.BookingStatus.ContractApproved) ?? 0,
                        CheckedIn = bookingsResult.Data?.Data.Count(b => b.BookingStatus == Models.BookingStatus.CheckedIn) ?? 0,
                        Completed = bookingsResult.Data?.Data.Count(b => b.BookingStatus == Models.BookingStatus.Completed) ?? 0,
                        Cancelled = bookingsResult.Data?.Data.Count(b => b.BookingStatus == Models.BookingStatus.Cancelled) ?? 0
                    },
                    RevenueStatistics = new
                    {
                        TotalRevenue = bookingsResult.Data?.Data
                            .Where(b => b.BookingStatus == Models.BookingStatus.Completed)
                            .Sum(b => b.TotalAmount) ?? 0,
                        ThisMonth = bookingsResult.Data?.Data
                            .Where(b => b.BookingStatus == Models.BookingStatus.Completed && 
                                       b.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                            .Sum(b => b.TotalAmount) ?? 0
                    }
                };

                return Ok(ResponseDto<object>.Success(dashboard, "Dashboard Admin"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        #endregion

        #region Reports & Analytics (Báo cáo & Phân tích)

        /// <summary>
        /// Báo cáo doanh thu theo điểm thuê (station)
        /// </summary>
        [HttpGet("Reports/Revenue-By-Station")]
        public async Task<ActionResult<ResponseDto<object>>> GetRevenueByStation(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var from = fromDate ?? DateTime.UtcNow.AddMonths(-1);
                var to = toDate ?? DateTime.UtcNow;

                // Lấy tất cả bookings đã hoàn thành
                var bookingsResult = await _bookingService.GetBookingsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 10000 
                });

                if (!bookingsResult.IsSuccess)
                {
                    return BadRequest(bookingsResult);
                }

                var completedBookings = bookingsResult.Data!.Data
                    .Where(b => b.BookingStatus == Models.BookingStatus.Completed &&
                               b.CreatedAt >= from && b.CreatedAt <= to)
                    .ToList();

                // Lấy danh sách stations
                var stationsResult = await _stationService.GetStationsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 1000 
                });

                if (!stationsResult.IsSuccess)
                {
                    return BadRequest(stationsResult);
                }

                // Group bookings by pickup station
                var revenueByStation = completedBookings
                    .GroupBy(b => new { b.PickupStationId, b.PickupStationName })
                    .Select(g => new
                    {
                        StationId = g.Key.PickupStationId,
                        StationName = g.Key.PickupStationName,
                        TotalBookings = g.Count(),
                        TotalRevenue = g.Sum(b => b.TotalAmount),
                        AverageRevenuePerBooking = g.Average(b => b.TotalAmount),
                        TotalHours = g.Sum(b => (b.ActualReturnDateTime ?? b.ExpectedReturnDateTime)
                            .Subtract(b.PickupDateTime).TotalHours),
                        TopCars = g.GroupBy(b => b.CarInfo)
                            .OrderByDescending(cg => cg.Count())
                            .Take(3)
                            .Select(cg => new
                            {
                                CarInfo = cg.Key,
                                BookingCount = cg.Count(),
                                Revenue = cg.Sum(b => b.TotalAmount)
                            })
                            .ToList()
                    })
                    .OrderByDescending(x => x.TotalRevenue)
                    .ToList();

                var totalRevenue = completedBookings.Sum(b => b.TotalAmount);

                var report = new
                {
                    Period = new
                    {
                        From = from,
                        To = to,
                        Days = (to - from).Days
                    },
                    Summary = new
                    {
                        TotalRevenue = totalRevenue,
                        TotalBookings = completedBookings.Count,
                        AverageRevenuePerDay = (to - from).Days > 0 ? totalRevenue / (to - from).Days : 0,
                        NumberOfStations = revenueByStation.Count
                    },
                    RevenueByStation = revenueByStation,
                    TopPerformingStations = revenueByStation.Take(5).ToList(),
                    LowPerformingStations = revenueByStation.TakeLast(5).ToList()
                };

                var message = $"Báo cáo doanh thu {revenueByStation.Count} điểm thuê từ {from:dd/MM/yyyy} đến {to:dd/MM/yyyy}";
                return Ok(ResponseDto<object>.Success(report, message));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Báo cáo tỷ lệ sử dụng xe theo thời gian
        /// </summary>
        [HttpGet("Reports/Car-Utilization")]
        public async Task<ActionResult<ResponseDto<object>>> GetCarUtilizationReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var from = fromDate ?? DateTime.UtcNow.AddMonths(-1);
                var to = toDate ?? DateTime.UtcNow;

                var totalDays = Math.Max((to - from).Days, 1);

                // Lấy tất cả xe
                var carsResult = await _carService.GetCarsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 10000 
                });

                if (!carsResult.IsSuccess)
                {
                    return BadRequest(carsResult);
                }

                // Lấy bookings đã hoàn thành hoặc đang sử dụng
                var bookingsResult = await _bookingService.GetBookingsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 10000 
                });

                if (!bookingsResult.IsSuccess)
                {
                    return BadRequest(bookingsResult);
                }

                var relevantBookings = bookingsResult.Data!.Data
                    .Where(b => (b.BookingStatus == Models.BookingStatus.Completed ||
                                b.BookingStatus == Models.BookingStatus.CheckedIn) &&
                               b.PickupDateTime >= from && b.PickupDateTime <= to)
                    .ToList();

                // Tính utilization rate cho mỗi xe
                var carUtilization = carsResult.Data!.Data
                    .Select(car =>
                    {
                        var carBookings = relevantBookings.Where(b => b.CarId == car.Id).ToList();
                        var totalHoursUsed = carBookings.Sum(b =>
                            (b.ActualReturnDateTime ?? b.ExpectedReturnDateTime)
                                .Subtract(b.PickupDateTime).TotalHours);

                        var totalAvailableHours = totalDays * 24;
                        var utilizationRate = totalAvailableHours > 0
                            ? (totalHoursUsed / totalAvailableHours) * 100
                            : 0;

                        return new
                        {
                            CarId = car.Id,
                            Brand = car.Brand,
                            Model = car.Model,
                            LicensePlate = car.LicensePlate,
                            CurrentStation = car.CurrentStationName,
                            TotalBookings = carBookings.Count,
                            TotalHoursUsed = Math.Round(totalHoursUsed, 2),
                            UtilizationRate = Math.Round(utilizationRate, 2),
                            Revenue = carBookings
                                .Where(b => b.BookingStatus == Models.BookingStatus.Completed)
                                .Sum(b => b.TotalAmount),
                            AverageBatteryLevel = car.CurrentBatteryLevel,
                            Status = car.IsAvailable ? "Available" : "In Use"
                        };
                    })
                    .OrderByDescending(x => x.UtilizationRate)
                    .ToList();

                // Phân loại xe theo utilization rate
                var highUtilization = carUtilization.Where(c => c.UtilizationRate >= 70).ToList();
                var mediumUtilization = carUtilization.Where(c => c.UtilizationRate >= 40 && c.UtilizationRate < 70).ToList();
                var lowUtilization = carUtilization.Where(c => c.UtilizationRate < 40).ToList();

                var report = new
                {
                    Period = new
                    {
                        From = from,
                        To = to,
                        Days = totalDays
                    },
                    Summary = new
                    {
                        TotalCars = carUtilization.Count,
                        AverageUtilizationRate = Math.Round(carUtilization.Average(c => c.UtilizationRate), 2),
                        HighUtilization = highUtilization.Count,
                        MediumUtilization = mediumUtilization.Count,
                        LowUtilization = lowUtilization.Count
                    },
                    UtilizationBreakdown = new
                    {
                        High = new { Count = highUtilization.Count, Percentage = Math.Round((double)highUtilization.Count / carUtilization.Count * 100, 2) },
                        Medium = new { Count = mediumUtilization.Count, Percentage = Math.Round((double)mediumUtilization.Count / carUtilization.Count * 100, 2) },
                        Low = new { Count = lowUtilization.Count, Percentage = Math.Round((double)lowUtilization.Count / carUtilization.Count * 100, 2) }
                    },
                    TopPerformingCars = carUtilization.Take(10).ToList(),
                    UnderutilizedCars = carUtilization.Where(c => c.UtilizationRate < 30).ToList(),
                    AllCars = carUtilization
                };

                return Ok(ResponseDto<object>.Success(report, 
                    "Báo cáo tỷ lệ sử dụng xe"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Phân tích giờ cao điểm (peak hours)
        /// </summary>
        [HttpGet("Reports/Peak-Hours")]
        public async Task<ActionResult<ResponseDto<object>>> GetPeakHoursAnalysis(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var from = fromDate ?? DateTime.UtcNow.AddMonths(-1);
                var to = toDate ?? DateTime.UtcNow;

                // Lấy tất cả bookings
                var bookingsResult = await _bookingService.GetBookingsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 10000 
                });

                if (!bookingsResult.IsSuccess)
                {
                    return BadRequest(bookingsResult);
                }

                var relevantBookings = bookingsResult.Data!.Data
                    .Where(b => b.PickupDateTime >= from && b.PickupDateTime <= to)
                    .ToList();

                // Phân tích theo giờ trong ngày (0-23)
                var bookingsByHour = relevantBookings
                    .GroupBy(b => b.PickupDateTime.Hour)
                    .Select(g => new
                    {
                        Hour = g.Key,
                        TimeRange = $"{g.Key:D2}:00 - {(g.Key + 1):D2}:00",
                        TotalBookings = g.Count(),
                        AverageBookingsPerDay = Math.Round((double)g.Count() / Math.Max((to - from).Days, 1), 2),
                        Revenue = g.Where(b => b.BookingStatus == Models.BookingStatus.Completed)
                            .Sum(b => b.TotalAmount)
                    })
                    .OrderByDescending(x => x.TotalBookings)
                    .ToList();

                // Phân tích theo ngày trong tuần
                var bookingsByDayOfWeek = relevantBookings
                    .GroupBy(b => b.PickupDateTime.DayOfWeek)
                    .Select(g => new
                    {
                        DayOfWeek = g.Key.ToString(),
                        DayNumber = (int)g.Key,
                        TotalBookings = g.Count(),
                        AverageBookingsPerWeek = Math.Round((double)g.Count() / Math.Max((to - from).Days / 7, 1), 2),
                        Revenue = g.Where(b => b.BookingStatus == Models.BookingStatus.Completed)
                            .Sum(b => b.TotalAmount)
                    })
                    .OrderByDescending(x => x.TotalBookings)
                    .ToList();

                // Phân tích check-in vs check-out patterns
                var checkInsByHour = relevantBookings
                    .GroupBy(b => b.PickupDateTime.Hour)
                    .Select(g => new { Hour = g.Key, Count = g.Count() })
                    .OrderBy(x => x.Hour)
                    .ToList();

                var checkOutsByHour = relevantBookings
                    .Where(b => b.ActualReturnDateTime.HasValue)
                    .GroupBy(b => b.ActualReturnDateTime!.Value.Hour)
                    .Select(g => new { Hour = g.Key, Count = g.Count() })
                    .OrderBy(x => x.Hour)
                    .ToList();

                // Xác định peak hours (top 5 giờ bận nhất)
                var peakHours = bookingsByHour.Take(5).ToList();
                var offPeakHours = bookingsByHour.TakeLast(5).ToList();

                var report = new
                {
                    Period = new
                    {
                        From = from,
                        To = to,
                        Days = (to - from).Days
                    },
                    Summary = new
                    {
                        TotalBookings = relevantBookings.Count,
                        AverageBookingsPerDay = Math.Round((double)relevantBookings.Count / Math.Max((to - from).Days, 1), 2),
                        PeakHour = bookingsByHour.FirstOrDefault()?.TimeRange ?? "N/A",
                        PeakDay = bookingsByDayOfWeek.FirstOrDefault()?.DayOfWeek ?? "N/A"
                    },
                    PeakHours = new
                    {
                        Top5BusiestHours = peakHours,
                        Top5QuietestHours = offPeakHours
                    },
                    HourlyDistribution = bookingsByHour.OrderBy(x => x.Hour).ToList(),
                    WeeklyDistribution = bookingsByDayOfWeek.OrderBy(x => x.DayNumber).ToList(),
                    CheckInCheckOutPattern = new
                    {
                        CheckInsByHour = checkInsByHour,
                        CheckOutsByHour = checkOutsByHour
                    },
                    Recommendations = new List<string>
                    {
                        peakHours.Any() ? $"Giờ cao điểm: {string.Join(", ", peakHours.Select(p => p.TimeRange))} - Cần đảm bảo đủ xe và nhân viên" : "Không có dữ liệu",
                        offPeakHours.Any() ? $"Giờ thấp điểm: {string.Join(", ", offPeakHours.Select(p => p.TimeRange))} - Có thể giảm nhân viên hoặc chạy khuyến mãi" : "Không có dữ liệu",
                        bookingsByDayOfWeek.Any() ? $"Ngày bận nhất: {bookingsByDayOfWeek.First().DayOfWeek} - Lên lịch bảo trì vào các ngày ít khách hơn" : "Không có dữ liệu"
                    }
                };

                return Ok(ResponseDto<object>.Success(report, 
                    "Phân tích giờ cao điểm"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        /// <summary>
        /// Báo cáo tổng hợp - Revenue trends theo thời gian
        /// </summary>
        [HttpGet("Reports/Revenue-Trends")]
        public async Task<ActionResult<ResponseDto<object>>> GetRevenueTrends(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string groupBy = "day") // day, week, month
        {
            try
            {
                var from = fromDate ?? DateTime.UtcNow.AddMonths(-3);
                var to = toDate ?? DateTime.UtcNow;

                var bookingsResult = await _bookingService.GetBookingsAsync(new PaginationRequestDto 
                { 
                    Page = 1, 
                    PageSize = 10000 
                });

                if (!bookingsResult.IsSuccess)
                {
                    return BadRequest(bookingsResult);
                }

                var completedBookings = bookingsResult.Data!.Data
                    .Where(b => b.BookingStatus == Models.BookingStatus.Completed &&
                               b.CreatedAt >= from && b.CreatedAt <= to)
                    .ToList();

                object trends;

                switch (groupBy.ToLower())
                {
                    case "week":
                        trends = completedBookings
                            .GroupBy(b => new
                            {
                                Year = b.CreatedAt.Year,
                                Week = System.Globalization.CultureInfo.CurrentCulture.Calendar
                                    .GetWeekOfYear(b.CreatedAt, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday)
                            })
                            .Select(g => new
                            {
                                Period = $"{g.Key.Year}-W{g.Key.Week:D2}",
                                Year = g.Key.Year,
                                Week = g.Key.Week,
                                TotalBookings = g.Count(),
                                Revenue = g.Sum(b => b.TotalAmount),
                                AverageBookingValue = g.Average(b => b.TotalAmount)
                            })
                            .OrderBy(x => x.Year).ThenBy(x => x.Week)
                            .ToList();
                        break;

                    case "month":
                        trends = completedBookings
                            .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
                            .Select(g => new
                            {
                                Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                                Year = g.Key.Year,
                                Month = g.Key.Month,
                                TotalBookings = g.Count(),
                                Revenue = g.Sum(b => b.TotalAmount),
                                AverageBookingValue = g.Average(b => b.TotalAmount)
                            })
                            .OrderBy(x => x.Year).ThenBy(x => x.Month)
                            .ToList();
                        break;

                    default: // day
                        trends = completedBookings
                            .GroupBy(b => b.CreatedAt.Date)
                            .Select(g => new
                            {
                                Period = g.Key.ToString("yyyy-MM-dd"),
                                Date = g.Key,
                                TotalBookings = g.Count(),
                                Revenue = g.Sum(b => b.TotalAmount),
                                AverageBookingValue = g.Average(b => b.TotalAmount)
                            })
                            .OrderBy(x => x.Date)
                            .ToList();
                        break;
                }

                var report = new
                {
                    Period = new
                    {
                        From = from,
                        To = to,
                        GroupBy = groupBy
                    },
                    Summary = new
                    {
                        TotalRevenue = completedBookings.Sum(b => b.TotalAmount),
                        TotalBookings = completedBookings.Count,
                        AverageBookingValue = completedBookings.Any() 
                            ? completedBookings.Average(b => b.TotalAmount) 
                            : 0
                    },
                    Trends = trends
                };

                return Ok(ResponseDto<object>.Success(report, 
                    $"Báo cáo xu hướng doanh thu theo {groupBy}"));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseDto<object>.Failure($"Lỗi: {ex.Message}"));
            }
        }

        #endregion
    }
}

