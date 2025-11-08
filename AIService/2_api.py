import pandas as pd
import pickle
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import sys

print("Khởi động API dự báo...")

# --- 1. TẢI MÔ HÌNH (BỘ NÃO) ĐÃ HUẤN LUYỆN ---
MODEL_FILE = "demand_model.pkl"
model = None

try:
    with open(MODEL_FILE, 'rb') as f:
        model = pickle.load(f)
    print(f"Đã tải mô hình '{MODEL_FILE}' thành công.")
except FileNotFoundError:
    print(f"LỖI: Không tìm thấy file mô hình '{MODEL_FILE}'.")
    print(">>> Bạn đã chạy '1_train_model.py' chưa?")
    sys.exit()
except Exception as e:
    print(f"LỖI khi tải mô hình: {e}")
    sys.exit()


# --- 2. KHỞI TẠO FASTAPI APP ---
app = FastAPI(
    title="API Dự báo Nhu cầu Thuê xe",
    description="API này nhận số ngày và trả về dự báo nhu cầu."
)

# --- 3. ĐỊNH NGHĨA ENDPOINT /PREDICT ---
# Đây là "địa chỉ" mà ASP.NET của bạn sẽ gọi
# Ví dụ: http://127.0.0.1:8000/predict?days_to_forecast=30

@app.get("/predict")
def predict_demand(days_to_forecast: int = 30):
    """
    Dự báo nhu cầu thuê xe cho 'days_to_forecast' ngày tới.
    """
    if model is None:
        return {"error": "Mô hình chưa được tải. Vui lòng kiểm tra log server."}

    if days_to_forecast <= 0 or days_to_forecast > 365:
        return {"error": "Số ngày dự báo (days_to_forecast) phải từ 1 đến 365."}

    try:
        print(f"Nhận yêu cầu dự báo cho {days_to_forecast} ngày...")
        
        # 1. Tạo một DataFrame "tương lai"
        # Prophet cần biết bạn muốn dự báo cho những ngày nào
        future_df = model.make_future_dataframe(periods=days_to_forecast)
        
        # 2. Thực hiện dự báo
        forecast_df = model.predict(future_df)
        
        # 3. Lọc kết quả để chỉ lấy phần dự báo (bỏ quá khứ)
        # Chúng ta chỉ lấy 3 cột: 'ds' (ngày), 'yhat' (dự báo), 'yhat_lower', 'yhat_upper' (khoảng tin cậy)
        results = forecast_df[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days_to_forecast)
        
        # Chuyển đổi ngày sang định dạng chuỗi (string) để gửi qua JSON
        results['ds'] = results['ds'].dt.strftime('%Y-%m-%d')
        # Làm tròn số dự báo (không thể có 0.5 lượt thuê)
        results['yhat'] = results['yhat'].round().astype(int)
        results['yhat_lower'] = results['yhat_lower'].round().astype(int)
        results['yhat_upper'] = results['yhat_upper'].round().astype(int)
        
        print("...Dự báo hoàn tất. Trả kết quả.")
        
        # Trả về kết quả dưới dạng JSON
        # 'orient='records'' sẽ biến DataFrame thành một danh sách các object
        # [ {"ds": "2025-11-09", "yhat": 5}, {"ds": "2025-11-10", "yhat": 7}, ... ]
        return results.to_dict(orient='records')

    except Exception as e:
        print(f"LỖI TRONG KHI DỰ BÁO: {e}")
        return {"error": f"Lỗi máy chủ nội bộ: {e}"}

# --- 4. CẤU HÌNH ĐỂ CHẠY SERVER (cho mục đích test) ---
if __name__ == "__main__":
    print("Chạy server Uvicorn tại http://127.0.0.1:8000")
    # --reload: tự động khởi động lại server khi bạn sửa code (rất tiện)
    uvicorn.run("2_api:app", host="127.0.0.1", port=8000, reload=True)