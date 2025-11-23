import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import contractApi from '../../../../services/contractApi'

const ContractList = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const renterId = localStorage.getItem('userId') || '3fa85f64-5717-4562-b3fc-2c963f66afa6'

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await contractApi.getContractsByRenter(renterId)
        if (response && response.length > 0) {
          setContracts(response)
        } else {
          setContracts([])
        }
      } catch (err) {
        console.error('Fetch contracts error:', err)
        setError(err.message || 'An error occurred while fetching contracts.')
      }
      setLoading(false)
    }

    if (renterId) {
      fetchContracts()
    }
  }, [renterId])

  const handleDownload = async (contractId, soHopDong) => {
    try {
      const blob = await contractApi.downloadContractById(contractId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `HopDong_${soHopDong || contractId}.docx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'An error occurred while downloading the contract.')
    }
  }

  if (loading)
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  if (error) return <p className="text-danger">Error: {error}</p>

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h2 className="card-title mb-0">My Contracts</h2>
        <Link to="/contract/new" className="btn btn-primary">
          Create New Contract
        </Link>
      </div>
      <div className="card-body">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Contract Number</th>
              <th>Booking ID</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length > 0 ? (
              contracts.map((contract) => (
                <tr key={contract.contractId}>
                  <td>{contract.soHopDong || 'N/A'}</td>
                  <td>
                    <Link to={`/contract/${contract.contractId}`}>{contract.bookingId}</Link>
                  </td>
                  <td>
                    <span className={`badge bg-${contract.isConfirmed ? 'success' : 'warning'}`}>
                      {contract.isConfirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(contract.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/contract/${contract.contractId}`} className="btn btn-sm btn-info me-2">
                      View
                    </Link>
                    <button
                      onClick={() => handleDownload(contract.contractId, contract.soHopDong)}
                      className="btn btn-sm btn-secondary"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No contracts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ContractList
