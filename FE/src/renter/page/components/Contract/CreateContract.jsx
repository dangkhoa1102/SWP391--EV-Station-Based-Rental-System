import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import contractApi from '../../../../services/contractApi'

const CreateContract = () => {
  const [formData, setFormData] = useState({
    soHopDong: '',
    ngayKy: new Date().getDate().toString(),
    thangKy: (new Date().getMonth() + 1).toString(),
    namKy: new Date().getFullYear().toString(),
    benA: { hoTen: '' },
    xe: { bienSo: '' },
    thoiHanThueSo: '1',
    thoiHanThueChu: 'một',
    giaThueSo: '10,000,000',
    giaThueChu: 'mười triệu đồng',
    phuongThucThanhToan: 'Chuyển khoản',
    ngayThanhToan: '15 hàng tháng'
  })
  const [bookingId, setBookingId] = useState('')
  const [renterId, setRenterId] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const requestData = {
        ...formData,
        thoiHanThue: 1,
        donViThoiHan: 'thang',
        gplx: { hang: 'B1', so: '123456789', hanSuDung: '31/12/2030' }
      }
      const response = await contractApi.createHopDong(requestData, bookingId, renterId)
      if (response && response.isSuccess !== false) {
        alert('Contract created successfully!')
        navigate(`/contract/${response}`)
      } else {
        setError(response?.message || 'Failed to create contract')
      }
    } catch (err) {
      setError(err.message || 'An error occurred.')
      console.error('Create contract error:', err)
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Create New Contract</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Booking ID</label>
              <input
                type="text"
                className="form-control"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Renter ID</label>
              <input
                type="text"
                className="form-control"
                value={renterId}
                onChange={(e) => setRenterId(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Contract Number</label>
              <input
                type="text"
                name="soHopDong"
                className="form-control"
                value={formData.soHopDong}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Renter's Full Name</label>
              <input
                type="text"
                name="benA.hoTen"
                className="form-control"
                value={formData.benA.hoTen}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">License Plate</label>
              <input
                type="text"
                name="xe.bienSo"
                className="form-control"
                value={formData.xe.bienSo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Contract'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateContract
