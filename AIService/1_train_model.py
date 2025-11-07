import pandas as pd
from prophet import Prophet
import pickle
from sqlalchemy import create_engine
import urllib
import sys

print("Bắt đầu kịch bản huấn luyện...")

# --- 1. KẾT NỐI DATABASE (SQL SERVER) ---
DB_SERVER = "LAPTOP-ESJA9OPT\\FEAX"
DB_DATABASE = "EVStationRentalDB"
DB_DRIVER = "{ODBC Driver 17 for SQL Server}" # Giữ nguyên nếu bạn đã cài driver 17

# Tạo chuỗi kết nối (connection string) cho Trusted Connection
try:
    params = urllib.parse.quote_plus(
        f"DRIVER={DB_DRIVER};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_DATABASE};"
        f"Trusted_Connection=yes;"
        f"TrustServerCertificate=yes;" # Lấy từ appsettings.json của bạn
    )
    engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")
    print(f"Đang kết nối tới: {DB_SERVER} -> {DB_DATABASE}...")
    
    # Thử kết nối
    connection = engine.connect()
    print("...Kết nối database thành công!")
    connection.close()

except Exception as e:
    print(f"LỖI KẾT NỐI DATABASE: {e}")
    print(">>> Vui lòng kiểm tra lại tên Server, Database và Driver ODBC.")
    sys.exit() # Dừng script nếu lỗi


# --- 2. TRUY VẤN DỮ LIỆU CỐT LÕI ---

# [OK] Đã cập nhật Status hoàn thành là 7
BOOKING_COMPLETED_STATUS = 7 

sql_query = f"""
    SELECT
        CAST(CreatedAt AS DATE) AS ds,  -- Đổi tên thành 'ds'
        COUNT(BookingId) AS y           -- Đã sửa từ 'Id' thành 'BookingId'
    FROM
        Bookings
    WHERE
        BookingStatus = {BOOKING_COMPLETED_STATUS}  -- [OK] Đã cập nhật là 7
    GROUP BY
        CAST(CreatedAt AS DATE)
    ORDER BY
        ds ASC;
"""

print(f"Đang thực thi truy vấn để lấy dữ liệu (với BookingStatus = {BOOKING_COMPLETED_STATUS})...")
try:
    df = pd.read_sql(sql_query, engine)
    print(f"Đã tải thành công {len(df)} dòng dữ liệu lịch sử.")
    
    if len(df) == 0:
        print(f"LỖI: Không tìm thấy dữ liệu nào với BookingStatus = {BOOKING_COMPLETED_STATUS}.")
        print("Vui lòng kiểm tra lại dữ liệu trong DB của bạn.")
        sys.exit()
    elif len(df) < 50: # Cần ít nhất 2 chu kỳ, ~ 2 tháng
        print(f"Cảnh báo: Dữ liệu có rất ít ({len(df)} điểm). Mô hình dự báo sẽ không chính xác.")
        print("Mô hình sẽ chạy, nhưng kết quả dự báo có thể không đáng tin cậy.")

except Exception as e:
    print(f"LỖI KHI TRUY VẤN DỮ LIỆU: {e}")
    print(">>> Vui lòng kiểm tra lại câu lệnh SQL (tên bảng, tên cột).")
    sys.exit()

# --- 3. TẠO DỮ LIỆU NGÀY LỄ (VIỆT NAM) ---
holidays_list = []
for year in range(2023, 2028): # Lấy vài năm qk và vài năm tương lai
    holidays_list.extend([
        {'holiday': 'Reunification Day', 'ds': f'{year}-04-30'},
        {'holiday': 'Labour Day', 'ds': f'{year}-05-01'},
        {'holiday': 'National Day', 'ds': f'{year}-09-02'},
        {'holiday': 'New Year', 'ds': f'{year}-01-01'},
    ])

# Thêm Tết Âm Lịch (quan trọng nhất)
tet_dates = [
    '2024-02-10', '2025-01-29', '2026-02-17', '2027-02-06'
]
for date_str in tet_dates:
    holidays_list.append({
        'holiday': 'Tet (Lunar New Year)', 
        'ds': date_str, 
        'lower_window': -3,  # Ảnh hưởng 3 ngày TRƯỚC Tết
        'upper_window': 7    # Ảnh hưởng 7 ngày SAU Tết
    })

holidays_df = pd.DataFrame(holidays_list)
print("Đã tạo xong danh sách ngày lễ.")

# --- 4. HUẤN LUYỆN MÔ HÌNH PROPHET ---
print("Bắt đầu huấn luyện mô hình Prophet (có thể mất vài giây)...")

model = Prophet(
    holidays=holidays_df,
    daily_seasonality=False, # Không cần nếu dự báo theo ngày
    weekly_seasonality=True, # Tự động học (ví dụ: T7 > T3)
    yearly_seasonality=True  # Tự động học (ví dụ: Hè > Đông)
)

# Huấn luyện mô hình!
model.fit(df)
print("...Huấn luyện hoàn tất!")

# --- 5. LƯU MÔ HÌNH RA FILE ---
model_filename = "demand_model.pkl"
try:
    with open(model_filename, 'wb') as f:
        pickle.dump(model, f)
    print(f"ĐÃ LƯU MÔ HÌNH thành công vào file: {model_filename}")

except Exception as e:
    print(f"Lỗi khi lưu mô hình: {e}")

print("--- KỊCH BẢN HUẤN LUYỆN HOÀN TẤT ---")