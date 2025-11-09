import React, { useState, useEffect } from 'react';
import { getContractsByRenter, downloadContractById } from '../services/ContractService';
import { Link } from 'react-router-dom';

const ContractList = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hardcoded renterId for demonstration purposes
    const renterId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'; // Replace with actual renter ID from auth

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const response = await getContractsByRenter(renterId);
                if (response.data.isSuccess) {
                    setContracts(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch contracts');
                }
            } catch (err) {
                setError(err.message || 'An error occurred while fetching contracts.');
            }
            setLoading(false);
        };

        fetchContracts();
    }, [renterId]);

    const handleDownload = async (contractId, soHopDong) => {
        try {
            const response = await downloadContractById(contractId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `HopDong_${soHopDong || contractId}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError(err.message || 'An error occurred while downloading the contract.');
        }
    };

    if (loading) return <p>Loading contracts...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">My Contracts</h2>
                <Link to="/contract/new" className="btn btn-primary float-end">Create New Contract</Link>
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
                            contracts.map(contract => (
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
                                        <Link to={`/contract/${contract.contractId}`} className="btn btn-sm btn-info me-2">View</Link>
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
                                <td colSpan="5" className="text-center">No contracts found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContractList;
