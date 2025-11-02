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
                    setContractHtml(response.data.data.htmlContent);
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
    if (error) return <p className="text-danger">Error: {error}</p>;

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
                <h2 className="card-title">Confirm and Sign Contract</h2>
                {contractInfo && (
                    <p className="card-subtitle mb-2 text-muted">
                        Contract Number: {contractInfo.soHopDong} | Renter: {contractInfo.hoTenBenA}
                    </p>
                )}
            </div>
            <div className="card-body">
                <div 
                    className="border p-3 mb-4" 
                    dangerouslySetInnerHTML={{ __html: contractHtml }}
                />

                <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" id="agreeCheck" />
                    <label className="form-check-label" htmlFor="agreeCheck">
                        I have read and agree to the terms of the contract.
                    </label>
                </div>

                <button 
                    className="btn btn-primary btn-lg"
                    onClick={handleSign}
                    disabled={signing}
                >
                    {signing ? 'Signing...' : 'Click to Sign'}
                </button>
            </div>
        </div>
    );
};

export default ConfirmContract;
