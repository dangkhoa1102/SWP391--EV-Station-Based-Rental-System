-- Add RefreshToken and RefreshTokenExpiry columns to Users table
USE EVStationRentalDB;
GO

-- Add RefreshToken column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'RefreshToken')
BEGIN
    ALTER TABLE [Users] ADD [RefreshToken] nvarchar(max) NULL;
    PRINT 'Column RefreshToken added successfully.';
END
ELSE
BEGIN
    PRINT 'Column RefreshToken already exists.';
END
GO

-- Add RefreshTokenExpiry column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'RefreshTokenExpiry')
BEGIN
    ALTER TABLE [Users] ADD [RefreshTokenExpiry] datetime2 NULL;
    PRINT 'Column RefreshTokenExpiry added successfully.';
END
ELSE
BEGIN
    PRINT 'Column RefreshTokenExpiry already exists.';
END
GO

-- Update migration history
IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20251014135047_AddRefreshTokenToUser')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251014135047_AddRefreshTokenToUser', N'8.0.20');
    PRINT 'Migration history updated.';
END
ELSE
BEGIN
    PRINT 'Migration already recorded in history.';
END
GO

PRINT 'All changes applied successfully!';
GO

