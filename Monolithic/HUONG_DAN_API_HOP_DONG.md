# H??NG D?N S? D?NG API H?P ??NG K� ?I?N T?

## T?ng Quan
H? th?ng h?p ??ng k� ?i?n t? t? ??ng gi?ng flow x�c th?c Facebook. Khi t?o h?p ??ng t? booking, h? th?ng s?:
1. Generate file DOCX t? template v?i th�ng tin user + booking
2. G?i email cho user v?i file ?�nh k�m v� link x�c nh?n
3. User click v�o link ? xem h?p ??ng ? x�c nh?n k�
4. H? th?ng c?p nh?t tr?ng th�i h?p ??ng

## Flow Ho�n Ch?nh

### B??c 1: T?o H?p ??ng T? Booking
**Endpoint:** `POST /api/Contracts/tao-tu-booking/{bookingId}`

**Ph�n quy?n:** Admin, StationStaff, EVRenter

**Request:**
```http
POST https://localhost:5001/api/Contracts/tao-tu-booking/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer {your_jwt_token}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "T?o h?p ??ng th�nh c�ng",
  "data": {
    "contractId": "12345678-abcd-efgh-ijkl-mnopqrstuvwx",
    "soHopDong": "HD-20250118-A1B2C3D4",
    "hoTenBenA": "Nguy?n V?n A",
    "bienSoXe": "29A-12345",
    "ngayTao": "2025-01-18T10:30:00Z",
    "status": "Pending",
    "filePath": "E:\\...\\Storage\\12345678-abcd-efgh-ijkl-mnopqrstuvwx.docx"
  }
}
```

### B??c 2: G?i Email X�c Nh?n K�
**Endpoint:** `POST /api/Contracts/gui-email-xac-nhan/{contractId}`

**Ph�n quy?n:** Admin, StationStaff

**Request:**
```http
POST https://localhost:5001/api/Contracts/gui-email-xac-nhan/12345678-abcd-efgh-ijkl-mnopqrstuvwx
Authorization: Bearer {your_jwt_token}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Email x�c nh?n ?� ???c g?i ?i.",
  "data": ""
}
```

**Email nh?n ???c:**
- Subject: `X�c nh?n K� H?p ??ng Thu� xe #HD-20250118-A1B2C3D4`
- N?i dung HTML ??p v?i n�t "X�C NH?N K� H?P ??NG"
- File DOCX ?�nh k�m
- Link h?t h?n sau 24 gi?

### B??c 3: User Xem H?p ??ng (T? Link Trong Email)
**Endpoint:** `GET /api/Contracts/xem-hop-dong?token={token}`

**Ph�n quy?n:** Public (kh�ng c?n ??ng nh?p)

**Request:**
```http
GET https://localhost:5001/api/Contracts/xem-hop-dong?token=abc123def456ghi789jkl012mno345pq
```

**Response:**
```json
{
  "isSuccess": true,
  "message": null,
  "data": {
    "soHopDong": "HD-20250118-A1B2C3D4",
    "nguoiKy": "Nguy?n V?n A",
    "ngayTao": "2025-01-18T10:30:00Z",
    "noiDungHtml": "<html><body>...n?i dung h?p ??ng ?� convert t? DOCX...</body></html>"
  }
}
```

### B??c 4: User X�c Nh?n K� H?p ??ng
**Endpoint:** `POST /api/Contracts/xac-nhan-ky`

**Ph�n quy?n:** Public (kh�ng c?n ??ng nh?p, d�ng token)

**Request:**
```http
POST https://localhost:5001/api/Contracts/xac-nhan-ky
Content-Type: application/json

{
  "token": "abc123def456ghi789jkl012mno345pq"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "H?p ??ng ?� ???c k� th�nh c�ng",
  "data": ""
}
```

## C�ch T�ch H?p Frontend

### Trang X�c Nh?n H?p ??ng (React Example)
```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

function XacNhanHopDong() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [hopDong, setHopDong] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load th�ng tin h?p ??ng
    axios.get(`/api/Contracts/xem-hop-dong?token=${token}`)
      .then(res => {
        setHopDong(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        alert('Link kh�ng h?p l? ho?c ?� h?t h?n');
      });
  }, [token]);

  const handleKyHopDong = async () => {
    try {
      const res = await axios.post('/api/Contracts/xac-nhan-ky', { token });
      if (res.data.isSuccess) {
        alert('? H?p ??ng ?� ???c k� th�nh c�ng!');
        // Redirect ho?c hi?n th? th�ng b�o th�nh c�ng
      }
    } catch (err) {
      alert('? C� l?i x?y ra: ' + err.response?.data?.message);
    }
  };

  if (loading) return <div>?ang t?i...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>X�c Nh?n H?p ??ng</h1>
      <p><strong>S? h?p ??ng:</strong> {hopDong.soHopDong}</p>
      <p><strong>Ng??i k�:</strong> {hopDong.nguoiKy}</p>
      
      <div 
        dangerouslySetInnerHTML={{ __html: hopDong.noiDungHtml }}
        style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20 }}
      />
      
      <button 
        onClick={handleKyHopDong}
        style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 'bold'
        }}
      >
        ?? X�C NH?N K� H?P ??NG
      </button>
    </div>
  );
}

export default XacNhanHopDong;
```

## C?u H�nh C?n Thi?t

### 1. C?u h�nh Frontend URL trong appsettings.json
```json
{
  "AppSettings": {
    "FrontendUrl": "http://localhost:3000"
  }
}
```

### 2. ??m b?o Template t?n t?i
??t file `hopdongthuexe.docx` trong th? m?c:
```
Monolithic/
  ??? Templates/
      ??? hopdongthuexe.docx
```

### 3. C�c Placeholder trong Template DOCX
```
{{so_hop_dong}}
{{ngay_ky}}, {{thang_ky}}, {{nam_ky}}
{{HO_TEN_BEN_A}}
{{nam_sinh_ben_a}}
{{cccd_hoac_ho_chieu_ben_a}}
{{ho_khau_thuong_tru}}
{{nhan_hieu}}
{{bien_so}}
{{loai_xe}}
{{mau_son}}
{{cho_ngoi}}
{{xe_dang_ki_han}}
{{gplx_hang}}
{{gplx_so}}
{{gplx_han_su_dung}}
{{thoi_han_thue_so}}
{{thoi_han_thue_chu}}
{{gia_thue_so}}
{{gia_thue_chu}}
{{phuong_thuc_thanh_toan}}
{{ngay_thanh_toan}}
```

### 4. Bi?n M�i Tr??ng Email
```bash
# Windows PowerShell
$env:PASSWORD="your_email_password"

# Linux/Mac
export PASSWORD=your_email_password
```

## C�c Tr??ng H?p L?i

### Token h?t h?n
```json
{
  "isSuccess": false,
  "message": "Link ?� h?t h?n",
  "data": null
}
```

### H?p ??ng ?� k�
```json
{
  "isSuccess": false,
  "message": "H?p ??ng ?� ???c k� tr??c ?�",
  "data": null
}
```

### Booking kh�ng t?n t?i
```json
{
  "isSuccess": false,
  "message": "Kh�ng t�m th?y booking",
  "data": null
}
```

## Testing v?i Swagger

1. M? Swagger UI: `https://localhost:5001/swagger`
2. Login ?? l?y JWT token (POST /api/Auth/Login)
3. Click "Authorize" v� nh?p token
4. Test c�c endpoint theo th? t?:
   - T?o h?p ??ng t? booking
   - G?i email x�c nh?n
   - (M? email) ? Copy token t? link
   - Xem h?p ??ng (kh�ng c?n auth)
   - X�c nh?n k� (kh�ng c?n auth)

## L?u � B?o M?t

1. **Token One-Time Use:** Token ch? d�ng ???c 1 l?n, sau khi k� xong s? b? v� hi?u h�a
2. **TTL 24 gi?:** Link x�c nh?n t? ??ng h?t h?n sau 24h
3. **HTTPS b?t bu?c:** Trong production ph?i d�ng HTTPS
4. **Rate Limiting:** N�n th�m rate limit cho endpoint public
5. **Email Verification:** Ch? g?i email ??n ??a ch? ?� x�c th?c trong h? th?ng

## C?u Tr�c Database

### Contract Model
```csharp
public class Contract
{
    public Guid Id { get; set; }
    public string SoHopDong { get; set; }
    public Guid BookingId { get; set; }
    public Guid UserId { get; set; }
    public Guid CarId { get; set; }
    public string HoTenBenA { get; set; }
    public string BienSoXe { get; set; }
    public ContractStatus Status { get; set; } // Pending, Signed, Expired
    public string? ConfirmationToken { get; set; }
    public DateTime? TokenExpiry { get; set; }
    public DateTime? NgayTao { get; set; }
    public DateTime? NgayKy { get; set; }
    public DateTime? NgayHetHan { get; set; }
    public bool IsDeleted { get; set; }
    
    // Navigation properties
    public Booking Booking { get; set; }
}
```

## Support
N?u c� v?n ??, check:
1. Logs trong console
2. Email settings (SMTP, password)
3. Template file t?n t?i
4. Database connection
5. JWT token c�n h?n

---
**Phi�n b?n:** 1.0.0  
**Ng�y c?p nh?t:** 2025-01-18
