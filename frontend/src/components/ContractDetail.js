import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getContractByBookingId, sendConfirmationEmail } from '../services/ContractService';

const ContractDetail = () => {
    const { id } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmationEmail, setConfirmationEmail] = useState('');

    useEffect(() => {
        const fetchContract = async () => {
            try {
                // This is a bit of a hack, since we don't have a direct get by contract id endpoint
                // We will try to get it by booking id, assuming the id from the url is the booking id
                const response = await getContractByBookingId(id);
                if (response.data.isSuccess) {
                    setContract(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch contract');
                }
            } catch (err) {
                setError(err.message || 'An error occurred while fetching the contract.');
            }
            setLoading(false);
        };

        fetchContract();
    }, [id]);

    const handleSendConfirmation = async () => {
        if (!confirmationEmail) {
            setError('Please enter an email address.');
            return;
        }
        try {
            await sendConfirmationEmail(contract.contractId, confirmationEmail);
            alert('Confirmation email sent successfully!');
        } catch (err) {
            setError(err.message || 'Failed to send confirmation email.');
        }
    };

    if (loading) return <p>Loading contract details...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;
    if (!contract) return <p>No contract found.</p>;

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
                    <span className={`badge bg-${contract.isConfirmed ? 'success' : 'warning'}`}>
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
                            <button className="btn btn-primary" onClick={handleSendConfirmation}>Send Confirmation</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractDetail;
