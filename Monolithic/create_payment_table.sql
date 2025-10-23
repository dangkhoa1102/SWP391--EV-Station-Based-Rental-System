-- Script tạo bảng Payments và quan hệ
-- Chạy script này trong SQL Server Management Studio

-- Kiểm tra xem bảng Payments đã tồn tại chưa
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Payments]') AND type in (N'U'))
BEGIN
    PRINT 'Đang tạo bảng Payments...';
    
    CREATE TABLE [Payments] (
        [PaymentId] uniqueidentifier NOT NULL DEFAULT (NEWID()),
        [BookingId] uniqueidentifier NOT NULL,
        [TransactionId] nvarchar(100) NOT NULL,
        [Amount] decimal(10,2) NOT NULL,
        [PaymentMethod] nvarchar(50) NOT NULL,
        [PaymentStatus] nvarchar(50) NOT NULL,
        [GatewayName] nvarchar(50) NULL,
        [GatewayTransactionId] nvarchar(500) NULL,
        [GatewayResponse] nvarchar(1000) NULL,
        [Description] nvarchar(500) NULL,
        [FailureReason] nvarchar(1000) NULL,
        [ProcessedAt] datetime2 NULL,
        [ExpiredAt] datetime2 NULL,
        [RefundTransactionId] nvarchar(100) NULL,
        [RefundedAt] datetime2 NULL,
        [RefundReason] nvarchar(500) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        CONSTRAINT [PK_Payments] PRIMARY KEY ([PaymentId])
    );
    
    PRINT 'Bảng Payments đã được tạo thành công!';
    
    -- Kiểm tra xem bảng Bookings có tồn tại không
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Bookings]') AND type in (N'U'))
    BEGIN
        -- Thêm khóa ngoại tới bảng Bookings
        ALTER TABLE [Payments] 
        ADD CONSTRAINT [FK_Payments_Bookings_BookingId] 
        FOREIGN KEY ([BookingId]) REFERENCES [Bookings] ([BookingId]) ON DELETE NO ACTION;
        
        PRINT 'Khóa ngoại tới bảng Bookings đã được tạo!';
    END
    ELSE
    BEGIN
        PRINT 'CẢNH BÁO: Bảng Bookings không tồn tại!';
    END
    
    -- Tạo các index
    CREATE INDEX [IX_Payments_BookingId] ON [Payments] ([BookingId]);
    CREATE INDEX [IX_Payments_CreatedAt] ON [Payments] ([CreatedAt]);
    CREATE INDEX [IX_Payments_ExpiredAt] ON [Payments] ([ExpiredAt]);
    CREATE INDEX [IX_Payments_PaymentMethod] ON [Payments] ([PaymentMethod]);
    CREATE INDEX [IX_Payments_PaymentStatus] ON [Payments] ([PaymentStatus]);
    CREATE UNIQUE INDEX [IX_Payments_TransactionId] ON [Payments] ([TransactionId]);
    
    PRINT 'Các index đã được tạo thành công!';
    
    -- Thêm record vào migration history
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251016145648_AddPaymentTable', N'8.0.20');
    
    PRINT 'Migration history đã được cập nhật!';
END
ELSE
BEGIN
    PRINT 'Bảng Payments đã tồn tại!';
END

PRINT 'Hoàn thành!';

