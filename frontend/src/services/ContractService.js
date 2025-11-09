import { apiClient } from './api';

export const createContract = (data) => {
  return apiClient.post('/Contracts/Create', data);
};

export const fillContract = (data) => {
  return apiClient.post('/Contracts/Fill', data);
};

export const requestConfirmation = (contractId, email) => {
  return apiClient.post(`/Contracts/Request-Confirmation-By-${contractId}`, { email });
};

export const confirmContract = (data) => {
  return apiClient.post('/Contracts/Confirm', data);
};

export const getContractByBookingId = (bookingId) => {
  return apiClient.get(`/Contracts/Get-By-Booking/${bookingId}`);
};

export const getContractsByRenter = (renterId) => {
  return apiClient.get(`/Contracts/Get-By-Renter/${renterId}`);
};

export const createHopDong = (data, bookingId, renterId) => {
  return apiClient.post(`/Contracts/hopdong/tao?bookingId=${bookingId}&renterId=${renterId}`, data);
};

export const sendConfirmationEmail = (contractId, email) => {
  return apiClient.post(`/Contracts/hopdong/${contractId}/gui-email`, { email });
};

export const getContractForConfirmation = (token) => {
  return apiClient.get(`/Contracts/hopdong/xac-nhan/${token}`);
};

export const signContract = (token) => {
  return apiClient.post('/Contracts/hopdong/ky', { token });
};

export const deleteContract = (contractId) => {
  return apiClient.delete(`/Contracts/hopdong/${contractId}`);
};

export const downloadContractByToken = (token) => {
  return apiClient.get(`/Contracts/hopdong/download/${token}`, { responseType: 'blob' });
};

export const downloadContractById = (contractId) => {
  return apiClient.get(`/Contracts/${contractId}/download`, { responseType: 'blob' });
};

export const downloadLatestContractByUserId = (userId) => {
  return apiClient.get(`/Contracts/user/download-latest-by-userId`, {
    params: { userId },
    responseType: 'blob'
  });
};

export const getContractByToken = (token) => {
  return apiClient.get(`/Contracts/hopdong/token/${token}`);
};
