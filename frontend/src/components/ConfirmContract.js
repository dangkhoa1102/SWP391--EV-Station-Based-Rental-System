import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getContractForConfirmation, signContract } from '../services/ContractService';

const ConfirmContract = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [contractHtml, setContractHtml] = useState('');
    const [contractInfo, setContractInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [signing, setSigning] = useState(false);
    const [signed, setSigned] = useState(false);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('No confirmation token provided.');
            setLoading(false);
            return;
        }

        const fetchContract = async () => {
            try {
                const response = await getContractForConfirmation(token);
                if (response.data.isSuccess) {
                    setContractInfo(response.data.data);
                    // Backend trả về property tên là 'noiDungHtml' (C# NoiDungHtml -> JSON noiDungHtml)
                    setContractHtml(response.data.data.noiDungHtml || response.data.data.htmlContent || '');
                } else {
                    setError(response.data.message || 'Failed to fetch contract for confirmation.');
                }
            } catch (err) {
                setError(err.message || 'An error occurred.');
            }
            setLoading(false);
        };

        fetchContract();
    }, [token]);

    const handleSign = async () => {
        setSigning(true);
        setError(null);
        try {
            const response = await signContract(token);
            if (response.data.isSuccess) {
                setSigned(true);
            } else {
                setError(response.data.message || 'Failed to sign the contract.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while signing.');
        }
        setSigning(false);
    };

    if (loading) return <p>Loading contract for confirmation...</p>;
    if (error) return <p className="text-danger">Error: ahihi{error}</p>;

    if (signed) {
        return (
            <div className="alert alert-success">
                <h4>Contract Signed Successfully!</h4>
                <p>Thank you for confirming your contract. You can now close this window.</p>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title mb-3">Confirm and Sign Contract</h2>
                {contractInfo && (
                    <div className="contract-info">
                        <div className="row">
                            {/* <div className="col-md-4">
                                <strong>Contract Number:</strong> {contractInfo.soHopDong || 'string'}
                            </div> */}
                            <div className="col-md-4">
                                <strong>Renter:</strong> {contractInfo.nguoiKy || 'N/A'}
                            </div>
                            <div className="col-md-4">
                                <strong>Date:</strong> {contractInfo.ngayTao ? new Date(contractInfo.ngayTao).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="card-body d-flex flex-column align-items-center">
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
    );
};

export default ConfirmContract;
