import React, { useState, useEffect } from 'react'
import contractApi from '../../../../services/contractApi'

const DownloadLatestContract = () => {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Auto-download when component mounts
    handleDownload()
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    setSuccess(false)
    try {
      // Call API that extracts userId from token automatically
      const blob = await contractApi.downloadMyLatestContract()
      
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `latest_contract_${new Date().getTime()}.docx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setSuccess(true)
    } catch (err) {
      console.error('Download error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while downloading.'
      
      if (err.response?.status === 401) {
        setError('Unauthorized: Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy hợp đồng nào. Vui lòng kiểm tra lại.')
      } else {
        setError(errorMessage)
      }
    }
    setDownloading(false)
  }

  return (
    <div className="card w-50 mx-auto">
      <div className="card-header">
        <h2 className="card-title">Tải Xuống Hợp Đồng Mới Nhất</h2>
      </div>
      <div className="card-body">
        <p>Tải xuống hợp đồng mới nhất của bạn dựa trên token đăng nhập.</p>
        {downloading && (
          <div className="alert alert-info">
            <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
            Đang tải xuống...
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Lỗi:</strong> {error}
            <div className="mt-3">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={handleDownload}
                disabled={downloading}
              >
                Thử lại
              </button>
            </div>
          </div>
        )}
        {success && (
          <div className="alert alert-success" role="alert">
            ✓ Hợp đồng đã được tải xuống thành công!
          </div>
        )}
        {!downloading && !error && !success && (
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleDownload}
          >
            Tải Xuống
          </button>
        )}
      </div>
    </div>
  )
}

export default DownloadLatestContract

