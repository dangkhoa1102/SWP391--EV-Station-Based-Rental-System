import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import contractApi from '../../../../services/contractApi'
import NotificationModal from '../../../../components/NotificationModal'

const ConfirmContract = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [contractHtml, setContractHtml] = useState('')
  const [contractInfo, setContractInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No confirmation token provided.')
      setLoading(false)
      return
    }

    const fetchContract = async () => {
      try {
        const response = await contractApi.getContractForConfirmation(token)
        if (response) {
          // setContractInfo(response)
          setContractHtml(response.noiDungHtml || response.htmlContent || '')
        } else {
          setError('Failed to fetch contract for confirmation.')
        }
      } catch (err) {
        setError(err.message || 'An error occurred.')
      }
      setLoading(false)
    }

    fetchContract()
  }, [token])

  const handleSign = async () => {
    setSigning(true)
    setError(null)
    try {
      console.log('📝 Signing contract with token:', token)
      const response = await contractApi.signContract(token)
      console.log('✅ Sign response:', response)
      console.log('✅ Response type:', typeof response)
      console.log('✅ Response is truthy:', !!response)
      
      // Accept any response (including empty string/null) - API likely returns empty string on success
      // Only fail if there's an explicit error indicator
      console.log('✅ Contract signed successfully!')
      setSigned(true)
      setShowNotification(true)
      
      // Redirect to booking history after 4 seconds (give notification time to show)
      setTimeout(() => {
        console.log('🔄 Redirecting to booking history...')
        navigate('/booking-history')
      }, 4000)
    } catch (err) {
      console.error('❌ Error signing contract:', err)
      setError(err.message || 'An error occurred while signing.')
    }
    setSigning(false)
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

  if (signed) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="alert alert-success text-center" style={{ maxWidth: '600px' }}>
          <h4 className="alert-heading">✅ Sign Successfully!</h4>
          <p>Your contract has been signed successfully.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            You will be redirected to booking history in a moment...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <NotificationModal
        isOpen={showNotification}
        type="success"
        title="Sign Successfully!"
        message="Your contract has been signed successfully. You will be redirected to booking history in a moment..."
        onClose={() => setShowNotification(false)}
        autoCloseMs={4000}
      />
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title mb-3">Confirm and Sign Contract</h2>
          {contractInfo && (
            <div className="contract-info">
              <div className="row">
                <div className="col-md-4">
                  <strong>Renter:</strong> {contractInfo.nguoiKy || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="border p-4 mb-4"
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '600px',
              overflowY: 'auto',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontFamily: "'Times New Roman', serif",
              fontSize: '14px',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: contractHtml }}
          />
          <hr style={{ width: '100%', maxWidth: '800px' }} />
          <div className="form-check mb-3" style={{ maxWidth: '800px', width: '100%' }}>
            <input
              className="form-check-input"
              type="checkbox"
              id="agreeCheck"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="agreeCheck">
              I have read and agree to the terms of the contract.
            </label>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ maxWidth: '800px', width: '100%' }}
            onClick={handleSign}
            disabled={signing || !agreed}
          >
            {signing ? 'Signing...' : 'Click to Sign'}
          </button>
        </div>
      </div>
    </>
  )
}

export default ConfirmContract
