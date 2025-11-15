import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import contractApi from '../../../../services/contractApi'

const ContractDetail = () => {
  const { id } = useParams()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmationEmail, setConfirmationEmail] = useState('')

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await contractApi.getContractByBooking(id)
        if (response) {
          setContract(response)
        } else {
          setError('Failed to fetch contract')
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching the contract.')
      }
      setLoading(false)
    }

    fetchContract()
  }, [id])

  const handleSendConfirmation = async () => {
    if (!confirmationEmail) {
      setError('Please enter an email address.')
      return
    }
    try {
      await contractApi.sendConfirmationEmail(contract.contractId, confirmationEmail)
      alert('Confirmation email sent successfully!')
      setConfirmationEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send confirmation email.')
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
  if (!contract) return <p>No contract found.</p>

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Contract Details</h2>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <strong>Contract ID:</strong> {contract.contractId}
        </div>
        <div className="mb-3">
          <strong>Booking ID:</strong> {contract.bookingId}
        </div>
        <div className="mb-3">
          <strong>Renter ID:</strong> {contract.renterId}
        </div>
        <div className="mb-3">
          <strong>Status:</strong>
          <span className={`badge bg-${contract.isConfirmed ? 'success' : 'warning'} ms-2`}>
            {contract.isConfirmed ? 'Confirmed' : 'Pending'}
          </span>
        </div>
        <div className="mb-3">
          <strong>Created At:</strong> {new Date(contract.createdAt).toLocaleString()}
        </div>
        <div className="mb-3">
          <strong>Contract Content:</strong>
          <pre className="border p-3">{contract.contractContent}</pre>
        </div>

        {!contract.isConfirmed && (
          <div className="mt-4">
            <h5>Confirm Contract</h5>
            <div className="input-group mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Enter email to receive confirmation link"
                value={confirmationEmail}
                onChange={(e) => setConfirmationEmail(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleSendConfirmation}>
                Send Confirmation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContractDetail
