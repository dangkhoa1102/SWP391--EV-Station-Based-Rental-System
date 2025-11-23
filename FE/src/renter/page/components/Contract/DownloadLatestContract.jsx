import React, { useState } from 'react'
import contractApi from '../../../../services/contractApi'

const DownloadLatestContract = () => {
  const [userId, setUserId] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  const handleDownload = async () => {
    if (!userId) {
      setError('Please enter a User ID.')
      return
    }
    setDownloading(true)
    setError(null)
    try {
      const blob = await contractApi.downloadLatestContractByUserId(userId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `latest_contract_${userId}.docx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred while downloading.'
      if (err.response?.status === 401) {
        setError(`Download failed: The server returned a 401 Unauthorized error. This may mean the API requires authentication.`)
      } else {
        setError(errorMessage)
      }
    }
    setDownloading(false)
  }

  return (
    <div className="card w-50 mx-auto">
      <div className="card-header">
        <h2 className="card-title">Download Latest Contract</h2>
      </div>
      <div className="card-body">
        <p>Enter the User ID to download their most recent contract.</p>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter User ID..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
        {error && <p className="text-danger mt-3">{error}</p>}
      </div>
    </div>
  )
}

export default DownloadLatestContract
