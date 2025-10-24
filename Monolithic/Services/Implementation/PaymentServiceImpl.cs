using AutoMapper;
using Monolithic.DTOs.Payment;
using Monolithic.DTOs.Common;
using Monolithic.Models;
using Monolithic.Repositories.Interfaces;
using Monolithic.Services.Interfaces;
using System.Text.Json;
using System.Linq.Expressions;

namespace Monolithic.Services.Implementation
{
    public class PaymentServiceImpl //: IPaymentService
    {
        //private readonly IPaymentRepository _paymentRepository;
        //private readonly IBookingRepository _bookingRepository;
        //private readonly IMapper _mapper;
        //private readonly ILogger<PaymentServiceImpl> _logger;

        //public PaymentServiceImpl(
        //    IPaymentRepository paymentRepository,
        //    IBookingRepository bookingRepository,
        //    IMapper mapper,
        //    ILogger<PaymentServiceImpl> logger)
        //{
        //    _paymentRepository = paymentRepository;
        //    _bookingRepository = bookingRepository;
        //    _mapper = mapper;
        //    _logger = logger;
        //}

        //public async Task<ResponseDto<PaymentDto>> CreatePaymentAsync(CreatePaymentDto request)
        //{
        //    try
        //    {
        //        // Validate booking exists and is in correct status
        //        var booking = await _bookingRepository.GetByIdAsync(request.BookingId);
        //        if (booking == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Booking not found");
        //        }

        //        if (booking.BookingStatus != BookingStatus.Pending)
        //        {
        //            return ResponseDto<PaymentDto>.Failure($"Cannot create payment for booking with status: {booking.BookingStatus}");
        //        }

        //        // Check if payment already exists for this booking
        //        var existingPayment = await _paymentRepository.GetLatestPaymentByBookingAsync(request.BookingId);
        //        if (existingPayment != null && existingPayment.PaymentStatus == PaymentStatus.Pending)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("A pending payment already exists for this booking");
        //        }

        //        // Generate transaction ID
        //        var transactionId = await GenerateTransactionIdAsync();
        //        if (!transactionId.IsSuccess)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Failed to generate transaction ID");
        //        }

        //        // Create payment entity
        //        var payment = new Payment
        //        {
        //            PaymentId = Guid.NewGuid(),
        //            BookingId = request.BookingId,
        //            TransactionId = transactionId.Data,
        //            Amount = request.Amount,
        //            PaymentMethod = request.PaymentMethod,
        //            PaymentStatus = PaymentStatus.Pending,
        //            GatewayName = GetGatewayName(request.PaymentMethod),
        //            Description = request.Description ?? $"Payment for booking {request.BookingId}",
        //            ExpiredAt = DateTime.UtcNow.AddMinutes(15), // 15 minutes expiry
        //            IsActive = true,
        //            CreatedAt = DateTime.UtcNow,
        //            UpdatedAt = DateTime.UtcNow
        //        };

        //        // Handle cash payment differently
        //        if (request.PaymentMethod == PaymentMethod.Cash)
        //        {
        //            payment.PaymentStatus = PaymentStatus.Success;
        //            payment.ProcessedAt = DateTime.UtcNow;
        //            payment.ExpiredAt = null;
        //        }

        //        var createdPayment = await _paymentRepository.AddAsync(payment);
        //        var paymentDto = _mapper.Map<PaymentDto>(createdPayment);

        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Payment created successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error creating payment for booking {BookingId}", request.BookingId);
        //        return ResponseDto<PaymentDto>.Failure($"Error creating payment: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentGatewayResponseDto>> ProcessPaymentAsync(Guid paymentId)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentGatewayResponseDto>.Failure("Payment not found");
        //        }

        //        if (payment.PaymentStatus != PaymentStatus.Pending)
        //        {
        //            return ResponseDto<PaymentGatewayResponseDto>.Failure($"Payment is not in pending status: {payment.PaymentStatus}");
        //        }

        //        // Update status to processing
        //        payment.PaymentStatus = PaymentStatus.Processing;
        //        payment.UpdatedAt = DateTime.UtcNow;
        //        await _paymentRepository.UpdateAsync(payment);

        //        // Process based on payment method
        //        PaymentGatewayResponseDto response;
        //        switch (payment.PaymentMethod)
        //        {
        //            case PaymentMethod.Cash:
        //                response = new PaymentGatewayResponseDto
        //                {
        //                    IsSuccess = true,
        //                    TransactionId = payment.TransactionId,
        //                    Message = "Cash payment processed successfully"
        //                };
        //                break;
        //            case PaymentMethod.VNPay:
        //                var vnpayResult = await CreateVNPayPaymentAsync(new CreatePaymentDto
        //                {
        //                    BookingId = payment.BookingId,
        //                    Amount = payment.Amount,
        //                    PaymentMethod = payment.PaymentMethod,
        //                    Description = payment.Description
        //                });
        //                response = vnpayResult.Data ?? new PaymentGatewayResponseDto { IsSuccess = false, Message = "VNPay payment failed" };
        //                break;
        //            case PaymentMethod.MoMo:
        //                var momoResult = await CreateMoMoPaymentAsync(new CreatePaymentDto
        //                {
        //                    BookingId = payment.BookingId,
        //                    Amount = payment.Amount,
        //                    PaymentMethod = payment.PaymentMethod,
        //                    Description = payment.Description
        //                });
        //                response = momoResult.Data ?? new PaymentGatewayResponseDto { IsSuccess = false, Message = "MoMo payment failed" };
        //                break;
        //            case PaymentMethod.ZaloPay:
        //                var zalopayResult = await CreateZaloPayPaymentAsync(new CreatePaymentDto
        //                {
        //                    BookingId = payment.BookingId,
        //                    Amount = payment.Amount,
        //                    PaymentMethod = payment.PaymentMethod,
        //                    Description = payment.Description
        //                });
        //                response = zalopayResult.Data ?? new PaymentGatewayResponseDto { IsSuccess = false, Message = "ZaloPay payment failed" };
        //                break;
        //            default:
        //                response = new PaymentGatewayResponseDto
        //                {
        //                    IsSuccess = false,
        //                    Message = $"Payment method {payment.PaymentMethod} is not supported"
        //                };
        //                break;
        //        }

        //        return ResponseDto<PaymentGatewayResponseDto>.Success(response);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error processing payment {PaymentId}", paymentId);
        //        return ResponseDto<PaymentGatewayResponseDto>.Failure($"Error processing payment: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> ConfirmPaymentAsync(ConfirmPaymentDto request)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(request.PaymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        if (payment.TransactionId != request.TransactionId)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Invalid transaction ID");
        //        }

        //        // Update payment status to success
        //        payment.PaymentStatus = PaymentStatus.Success;
        //        payment.ProcessedAt = DateTime.UtcNow;
        //        payment.GatewayResponse = request.GatewayResponse;
        //        payment.UpdatedAt = DateTime.UtcNow;

        //        var updatedPayment = await _paymentRepository.UpdateAsync(payment);

        //        // Update booking status
        //        var booking = await _bookingRepository.GetByIdAsync(payment.BookingId);
        //        if (booking != null)
        //        {
        //            booking.BookingStatus = BookingStatus.ContractApproved;
        //            booking.PaymentStatus = "Paid";
        //            booking.UpdatedAt = DateTime.UtcNow;
        //            await _bookingRepository.UpdateAsync(booking);
        //        }

        //        var paymentDto = _mapper.Map<PaymentDto>(updatedPayment);
        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Payment confirmed successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error confirming payment {PaymentId}", request.PaymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error confirming payment: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> CancelPaymentAsync(Guid paymentId, string reason)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        if (payment.PaymentStatus != PaymentStatus.Pending && payment.PaymentStatus != PaymentStatus.Processing)
        //        {
        //            return ResponseDto<PaymentDto>.Failure($"Cannot cancel payment with status: {payment.PaymentStatus}");
        //        }

        //        payment.PaymentStatus = PaymentStatus.Cancelled;
        //        payment.FailureReason = reason;
        //        payment.UpdatedAt = DateTime.UtcNow;

        //        var updatedPayment = await _paymentRepository.UpdateAsync(payment);
        //        var paymentDto = _mapper.Map<PaymentDto>(updatedPayment);

        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Payment cancelled successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error cancelling payment {PaymentId}", paymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error cancelling payment: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> GetPaymentByIdAsync(Guid paymentId)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        var paymentDto = _mapper.Map<PaymentDto>(payment);
        //        return ResponseDto<PaymentDto>.Success(paymentDto);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting payment {PaymentId}", paymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error getting payment: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> GetPaymentByTransactionIdAsync(string transactionId)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByTransactionIdAsync(transactionId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        var paymentDto = _mapper.Map<PaymentDto>(payment);
        //        return ResponseDto<PaymentDto>.Success(paymentDto);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting payment by transaction ID {TransactionId}", transactionId);
        //        return ResponseDto<PaymentDto>.Failure($"Error getting payment: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<IEnumerable<PaymentDto>>> GetPaymentsByBookingIdAsync(Guid bookingId)
        //{
        //    try
        //    {
        //        var payments = await _paymentRepository.GetByBookingIdAsync(bookingId);
        //        var paymentDtos = _mapper.Map<IEnumerable<PaymentDto>>(payments);
        //        return ResponseDto<IEnumerable<PaymentDto>>.Success(paymentDtos);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting payments for booking {BookingId}", bookingId);
        //        return ResponseDto<IEnumerable<PaymentDto>>.Failure($"Error getting payments: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<IEnumerable<PaymentDto>>> GetPaymentsByUserIdAsync(Guid userId)
        //{
        //    try
        //    {
        //        var payments = await _paymentRepository.GetByUserIdAsync(userId);
        //        var paymentDtos = _mapper.Map<IEnumerable<PaymentDto>>(payments);
        //        return ResponseDto<IEnumerable<PaymentDto>>.Success(paymentDtos);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting payments for user {UserId}", userId);
        //        return ResponseDto<IEnumerable<PaymentDto>>.Failure($"Error getting payments: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PagedResult<PaymentDto>>> SearchPaymentsAsync(PaymentSearchDto searchDto)
        //{
        //    try
        //    {
        //        Expression<Func<Payment, bool>>? predicate = null;

        //        if (searchDto.BookingId.HasValue)
        //        {
        //            predicate = p => p.BookingId == searchDto.BookingId.Value;
        //        }

        //        if (searchDto.PaymentMethod.HasValue)
        //        {
        //            Expression<Func<Payment, bool>> methodPredicate = p => p.PaymentMethod == searchDto.PaymentMethod.Value;
        //            predicate = predicate == null ? methodPredicate : CombineExpressions(predicate, methodPredicate);
        //        }

        //        if (searchDto.PaymentStatus.HasValue)
        //        {
        //            Expression<Func<Payment, bool>> statusPredicate = p => p.PaymentStatus == searchDto.PaymentStatus.Value;
        //            predicate = predicate == null ? statusPredicate : CombineExpressions(predicate, statusPredicate);
        //        }

        //        if (!string.IsNullOrEmpty(searchDto.TransactionId))
        //        {
        //            Expression<Func<Payment, bool>> transactionPredicate = p => p.TransactionId.Contains(searchDto.TransactionId);
        //            predicate = predicate == null ? transactionPredicate : CombineExpressions(predicate, transactionPredicate);
        //        }

        //        if (searchDto.FromDate.HasValue)
        //        {
        //            Expression<Func<Payment, bool>> fromDatePredicate = p => p.CreatedAt >= searchDto.FromDate.Value;
        //            predicate = predicate == null ? fromDatePredicate : CombineExpressions(predicate, fromDatePredicate);
        //        }

        //        if (searchDto.ToDate.HasValue)
        //        {
        //            Expression<Func<Payment, bool>> toDatePredicate = p => p.CreatedAt <= searchDto.ToDate.Value;
        //            predicate = predicate == null ? toDatePredicate : CombineExpressions(predicate, toDatePredicate);
        //        }

        //        if (searchDto.MinAmount.HasValue)
        //        {
        //            Expression<Func<Payment, bool>> minAmountPredicate = p => p.Amount >= searchDto.MinAmount.Value;
        //            predicate = predicate == null ? minAmountPredicate : CombineExpressions(predicate, minAmountPredicate);
        //        }

        //        if (searchDto.MaxAmount.HasValue)
        //        {
        //            Expression<Func<Payment, bool>> maxAmountPredicate = p => p.Amount <= searchDto.MaxAmount.Value;
        //            predicate = predicate == null ? maxAmountPredicate : CombineExpressions(predicate, maxAmountPredicate);
        //        }

        //        var (items, totalCount) = await _paymentRepository.GetPagedAsync(
        //            predicate,
        //            searchDto.Page,
        //            searchDto.PageSize,
        //            "CreatedAt",
        //            false);

        //        var paymentDtos = _mapper.Map<IEnumerable<PaymentDto>>(items);

        //        var result = new PagedResult<PaymentDto>
        //        {
        //            Items = paymentDtos,
        //            TotalCount = totalCount,
        //            Page = searchDto.Page,
        //            PageSize = searchDto.PageSize
        //        };

        //        return ResponseDto<PagedResult<PaymentDto>>.Success(result);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error searching payments");
        //        return ResponseDto<PagedResult<PaymentDto>>.Failure($"Error searching payments: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> UpdatePaymentStatusAsync(Guid paymentId, PaymentStatus status, string? reason = null)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        payment.PaymentStatus = status;
        //        if (!string.IsNullOrEmpty(reason))
        //        {
        //            payment.FailureReason = reason;
        //        }
        //        payment.UpdatedAt = DateTime.UtcNow;

        //        if (status == PaymentStatus.Success)
        //        {
        //            payment.ProcessedAt = DateTime.UtcNow;
        //        }

        //        var updatedPayment = await _paymentRepository.UpdateAsync(payment);
        //        var paymentDto = _mapper.Map<PaymentDto>(updatedPayment);

        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Payment status updated successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error updating payment status {PaymentId}", paymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error updating payment status: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> MarkPaymentAsProcessedAsync(Guid paymentId, string gatewayTransactionId, string? gatewayResponse = null)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        payment.PaymentStatus = PaymentStatus.Success;
        //        payment.GatewayTransactionId = gatewayTransactionId;
        //        payment.GatewayResponse = gatewayResponse;
        //        payment.ProcessedAt = DateTime.UtcNow;
        //        payment.UpdatedAt = DateTime.UtcNow;

        //        var updatedPayment = await _paymentRepository.UpdateAsync(payment);
        //        var paymentDto = _mapper.Map<PaymentDto>(updatedPayment);

        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Payment marked as processed successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error marking payment as processed {PaymentId}", paymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error marking payment as processed: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> MarkPaymentAsFailedAsync(Guid paymentId, string reason)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        payment.PaymentStatus = PaymentStatus.Failed;
        //        payment.FailureReason = reason;
        //        payment.UpdatedAt = DateTime.UtcNow;

        //        var updatedPayment = await _paymentRepository.UpdateAsync(payment);
        //        var paymentDto = _mapper.Map<PaymentDto>(updatedPayment);

        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Payment marked as failed successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error marking payment as failed {PaymentId}", paymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error marking payment as failed: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> RefundPaymentAsync(RefundPaymentDto request)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(request.PaymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        if (payment.PaymentStatus != PaymentStatus.Success)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Only successful payments can be refunded");
        //        }

        //        if (payment.RefundedAt.HasValue)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment has already been refunded");
        //        }

        //        if (request.RefundAmount > payment.Amount)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Refund amount cannot exceed payment amount");
        //        }

        //        payment.RefundTransactionId = request.RefundTransactionId ?? $"REF-{payment.TransactionId}-{DateTime.UtcNow:yyyyMMddHHmmss}";
        //        payment.RefundReason = request.RefundReason;
        //        payment.RefundedAt = DateTime.UtcNow;
        //        payment.PaymentStatus = request.RefundAmount == payment.Amount ? PaymentStatus.Refunded : PaymentStatus.PartialRefunded;
        //        payment.UpdatedAt = DateTime.UtcNow;

        //        var updatedPayment = await _paymentRepository.UpdateAsync(payment);
        //        var paymentDto = _mapper.Map<PaymentDto>(updatedPayment);

        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Payment refunded successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error refunding payment {PaymentId}", request.PaymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error refunding payment: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentDto>> ProcessRefundAsync(Guid paymentId, string refundTransactionId)
        //{
        //    try
        //    {
        //        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        //        if (payment == null)
        //        {
        //            return ResponseDto<PaymentDto>.Failure("Payment not found");
        //        }

        //        payment.RefundTransactionId = refundTransactionId;
        //        payment.RefundedAt = DateTime.UtcNow;
        //        payment.PaymentStatus = PaymentStatus.Refunded;
        //        payment.UpdatedAt = DateTime.UtcNow;

        //        var updatedPayment = await _paymentRepository.UpdateAsync(payment);
        //        var paymentDto = _mapper.Map<PaymentDto>(updatedPayment);

        //        return ResponseDto<PaymentDto>.Success(paymentDto, "Refund processed successfully");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error processing refund {PaymentId}", paymentId);
        //        return ResponseDto<PaymentDto>.Failure($"Error processing refund: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<PaymentStatisticsDto>> GetPaymentStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null)
        //{
        //    try
        //    {
        //        var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
        //        var to = toDate ?? DateTime.UtcNow;

        //        var payments = await _paymentRepository.GetByDateRangeAsync(from, to);
        //        var activePayments = payments.Where(p => p.IsActive).ToList();

        //        var statistics = new PaymentStatisticsDto
        //        {
        //            TotalAmount = activePayments.Where(p => p.PaymentStatus == PaymentStatus.Success).Sum(p => p.Amount),
        //            TotalTransactions = activePayments.Count,
        //            SuccessCount = activePayments.Count(p => p.PaymentStatus == PaymentStatus.Success),
        //            FailedCount = activePayments.Count(p => p.PaymentStatus == PaymentStatus.Failed),
        //            PendingCount = activePayments.Count(p => p.PaymentStatus == PaymentStatus.Pending),
        //            RefundedCount = activePayments.Count(p => p.PaymentStatus == PaymentStatus.Refunded || p.PaymentStatus == PaymentStatus.PartialRefunded),
        //            SuccessAmount = activePayments.Where(p => p.PaymentStatus == PaymentStatus.Success).Sum(p => p.Amount),
        //            RefundedAmount = activePayments.Where(p => p.PaymentStatus == PaymentStatus.Refunded || p.PaymentStatus == PaymentStatus.PartialRefunded).Sum(p => p.Amount),
        //            PaymentMethodCounts = activePayments.GroupBy(p => p.PaymentMethod).ToDictionary<IGrouping<PaymentMethod, Payment>, PaymentMethod, int>(g => g.Key, g => g.Count()),
        //            PaymentStatusCounts = activePayments.GroupBy(p => p.PaymentStatus).ToDictionary<IGrouping<PaymentStatus, Payment>, PaymentStatus, int>(g => g.Key, g => g.Count())
        //        };

        //        return ResponseDto<PaymentStatisticsDto>.Success(statistics);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting payment statistics");
        //        return ResponseDto<PaymentStatisticsDto>.Failure($"Error getting payment statistics: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<decimal>> GetTotalAmountByBookingAsync(Guid bookingId)
        //{
        //    try
        //    {
        //        var totalAmount = await _paymentRepository.GetTotalAmountByBookingAsync(bookingId);
        //        return ResponseDto<decimal>.Success(totalAmount);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting total amount for booking {BookingId}", bookingId);
        //        return ResponseDto<decimal>.Failure($"Error getting total amount: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<decimal>> GetTotalAmountByUserAsync(Guid userId)
        //{
        //    try
        //    {
        //        var totalAmount = await _paymentRepository.GetTotalAmountByUserAsync(userId);
        //        return ResponseDto<decimal>.Success(totalAmount);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting total amount for user {UserId}", userId);
        //        return ResponseDto<decimal>.Failure($"Error getting total amount: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<IEnumerable<PaymentDto>>> GetExpiredPaymentsAsync()
        //{
        //    try
        //    {
        //        var expiredPayments = await _paymentRepository.GetExpiredPaymentsAsync();
        //        var paymentDtos = _mapper.Map<IEnumerable<PaymentDto>>(expiredPayments);
        //        return ResponseDto<IEnumerable<PaymentDto>>.Success(paymentDtos);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting expired payments");
        //        return ResponseDto<IEnumerable<PaymentDto>>.Failure($"Error getting expired payments: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<bool>> CleanupExpiredPaymentsAsync()
        //{
        //    try
        //    {
        //        var expiredPayments = await _paymentRepository.GetExpiredPaymentsAsync();
        //        var count = 0;

        //        foreach (var payment in expiredPayments)
        //        {
        //            payment.PaymentStatus = PaymentStatus.Expired;
        //            payment.UpdatedAt = DateTime.UtcNow;
        //            await _paymentRepository.UpdateAsync(payment);
        //            count++;
        //        }

        //        _logger.LogInformation("Cleaned up {Count} expired payments", count);
        //        return ResponseDto<bool>.Success(true, $"Cleaned up {count} expired payments");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error cleaning up expired payments");
        //        return ResponseDto<bool>.Failure($"Error cleaning up expired payments: {ex.Message}");
        //    }
        //}

        //public async Task<ResponseDto<string>> GenerateTransactionIdAsync()
        //{
        //    try
        //    {
        //        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        //        var random = new Random().Next(1000, 9999);
        //        var transactionId = $"TXN{timestamp}{random}";

        //        // Ensure uniqueness
        //        var existingPayment = await _paymentRepository.GetByTransactionIdAsync(transactionId);
        //        if (existingPayment != null)
        //        {
        //            return await GenerateTransactionIdAsync(); // Recursive call to generate new ID
        //        }

        //        return ResponseDto<string>.Success(transactionId);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error generating transaction ID");
        //        return ResponseDto<string>.Failure($"Error generating transaction ID: {ex.Message}");
        //    }
        //}

        //// Gateway integration methods (simplified implementations)
        //public async Task<ResponseDto<PaymentGatewayResponseDto>> CreateVNPayPaymentAsync(CreatePaymentDto request)
        //{
        //    // TODO: Implement VNPay integration
        //    return ResponseDto<PaymentGatewayResponseDto>.Success(new PaymentGatewayResponseDto
        //    {
        //        IsSuccess = true,
        //        TransactionId = $"VNPAY_{DateTime.UtcNow:yyyyMMddHHmmss}",
        //        PaymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        //        Message = "VNPay payment URL generated successfully"
        //    });
        //}

        //public async Task<ResponseDto<PaymentGatewayResponseDto>> CreateMoMoPaymentAsync(CreatePaymentDto request)
        //{
        //    // TODO: Implement MoMo integration
        //    return ResponseDto<PaymentGatewayResponseDto>.Success(new PaymentGatewayResponseDto
        //    {
        //        IsSuccess = true,
        //        TransactionId = $"MOMO_{DateTime.UtcNow:yyyyMMddHHmmss}",
        //        PaymentUrl = "https://test-payment.momo.vn/v2/gateway/api/create",
        //        QrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        //        Message = "MoMo payment created successfully"
        //    });
        //}

        //public async Task<ResponseDto<PaymentGatewayResponseDto>> CreateZaloPayPaymentAsync(CreatePaymentDto request)
        //{
        //    // TODO: Implement ZaloPay integration
        //    return ResponseDto<PaymentGatewayResponseDto>.Success(new PaymentGatewayResponseDto
        //    {
        //        IsSuccess = true,
        //        TransactionId = $"ZALOPAY_{DateTime.UtcNow:yyyyMMddHHmmss}",
        //        PaymentUrl = "https://sb-openapi.zalopay.vn/v2/create",
        //        Message = "ZaloPay payment created successfully"
        //    });
        //}

        //public async Task<ResponseDto<bool>> VerifyPaymentCallbackAsync(string gatewayName, Dictionary<string, string> callbackData)
        //{
        //    // TODO: Implement gateway callback verification
        //    return ResponseDto<bool>.Success(true, "Payment callback verified successfully");
        //}

        //// Helper methods
        //private string? GetGatewayName(PaymentMethod paymentMethod)
        //{
        //    return paymentMethod switch
        //    {
        //        PaymentMethod.VNPay => "VNPay",
        //        PaymentMethod.MoMo => "MoMo",
        //        PaymentMethod.ZaloPay => "ZaloPay",
        //        PaymentMethod.CreditCard => "CreditCard",
        //        PaymentMethod.BankTransfer => "BankTransfer",
        //        PaymentMethod.Wallet => "Wallet",
        //        PaymentMethod.Cash => null,
        //        _ => null
        //    };
        //}

        //private Expression<Func<Payment, bool>> CombineExpressions(Expression<Func<Payment, bool>> expr1, Expression<Func<Payment, bool>> expr2)
        //{
        //    var parameter = Expression.Parameter(typeof(Payment), "p");
        //    var left = Expression.Invoke(expr1, parameter);
        //    var right = Expression.Invoke(expr2, parameter);
        //    var combined = Expression.AndAlso(left, right);
        //    return Expression.Lambda<Func<Payment, bool>>(combined, parameter);
        //}
    }
}
