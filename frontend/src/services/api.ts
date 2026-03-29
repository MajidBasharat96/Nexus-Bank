import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Tenant-ID'] = 'default';
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (refreshToken) {
              const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
              useAuthStore.getState().updateToken(res.data.data.accessToken);
              original.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
              return this.client(original);
            }
          } catch {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }

        const message = error.response?.data?.error || error.message || 'An error occurred';
        if (error.response?.status !== 401) toast.error(message);
        return Promise.reject(error);
      }
    );
  }

  // Auth
  login = (username: string, password: string) => this.client.post('/auth/login', { username, password });
  logout = (refreshToken: string) => this.client.post('/auth/logout', { refreshToken });
  refreshToken = (refreshToken: string) => this.client.post('/auth/refresh', { refreshToken });
  getProfile = () => this.client.get('/auth/profile');
  changePassword = (data: any) => this.client.post('/auth/change-password', data);
  setupMfa = () => this.client.post('/auth/mfa/setup');
  enableMfa = (code: string) => this.client.post('/auth/mfa/enable', { code });

  // Customers
  getCustomers = (params?: any) => this.client.get('/customers', { params });
  getCustomer = (id: string) => this.client.get(`/customers/${id}`);
  createCustomer = (data: any) => this.client.post('/customers', data);
  updateCustomer = (id: string, data: any) => this.client.put(`/customers/${id}`, data);
  updateKyc = (id: string, data: any) => this.client.patch(`/customers/${id}/kyc`, data);
  searchCustomers = (q: string) => this.client.get('/customers/search', { params: { q } });
  getCustomerTransactions = (id: string, params?: any) => this.client.get(`/customers/${id}/transactions`, { params });

  // Accounts
  getAccounts = (params?: any) => this.client.get('/accounts', { params });
  getAccount = (id: string) => this.client.get(`/accounts/${id}`);
  createAccount = (data: any) => this.client.post('/accounts', data);
  getAccountBalance = (id: string) => this.client.get(`/accounts/${id}/balance`);
  updateAccountStatus = (id: string, status: string) => this.client.patch(`/accounts/${id}/status`, { status });
  getAccountsDashboard = () => this.client.get('/accounts/dashboard');

  // Transactions
  getTransactions = (params?: any) => this.client.get('/transactions', { params });
  deposit = (data: any) => this.client.post('/transactions/deposit', data);
  withdraw = (data: any) => this.client.post('/transactions/withdraw', data);
  transfer = (data: any) => this.client.post('/transactions/transfer', data);
  reverseTransaction = (id: string, reason: string) => this.client.post(`/transactions/${id}/reverse`, { reason });
  getTransactionStats = () => this.client.get('/transactions/stats');

  // Loans
  getLoans = (params?: any) => this.client.get('/loans', { params });
  getLoan = (id: string) => this.client.get(`/loans/${id}`);
  applyLoan = (data: any) => this.client.post('/loans', data);
  approveLoan = (id: string, data: any) => this.client.post(`/loans/${id}/approve`, data);
  repayLoan = (id: string, data: any) => this.client.post(`/loans/${id}/repay`, data);
  getLoanStats = () => this.client.get('/loans/stats');

  // Cards
  getCards = (params?: any) => this.client.get('/cards', { params });
  createCard = (data: any) => this.client.post('/cards', data);
  updateCardStatus = (id: string, status: string, reason?: string) => this.client.patch(`/cards/${id}/status`, { status, reason });

  // Compliance
  getComplianceAlerts = () => this.client.get('/compliance/alerts');
  updateComplianceAlert = (id: string, data: any) => this.client.patch(`/compliance/alerts/${id}`, data);
  getAmlReport = () => this.client.get('/compliance/aml-report');

  // Fraud
  getFraudAlerts = (params?: any) => this.client.get('/fraud/alerts', { params });
  reviewFraudAlert = (id: string, action: string, notes: string) => this.client.patch(`/fraud/alerts/${id}/review`, { action, notes });
  getFraudStats = () => this.client.get('/fraud/stats');

  // Reports
  getDashboardReport = () => this.client.get('/reports/dashboard');
  getTransactionVolume = () => this.client.get('/reports/transaction-volume');

  // Treasury
  getLiquidity = () => this.client.get('/treasury/liquidity');
  getCashFlow = () => this.client.get('/treasury/cash-flow');

  // Admin
  getUsers = () => this.client.get('/admin/users');
  createUser = (data: any) => this.client.post('/admin/users', data);
  updateUserStatus = (id: string, isActive: boolean) => this.client.patch(`/admin/users/${id}/status`, { isActive });
  getAuditLogs = () => this.client.get('/admin/audit-logs');
  getSystemHealth = () => this.client.get('/admin/system-health');

  // Branches
  getBranches = () => this.client.get('/branches');
  createBranch = (data: any) => this.client.post('/branches', data);

  // Integrations
  verifyIBAN = (iban: string) => this.client.post('/integrations/raast/verify-iban', { iban });
  raastTransfer = (data: any) => this.client.post('/integrations/raast/transfer', data);
  verifyNADRA = (data: any) => this.client.post('/integrations/nadra/verify', data);
  getCreditScore = (cnic: string) => this.client.get(`/integrations/credit-bureau/${cnic}`);
}

export const api = new ApiClient();
