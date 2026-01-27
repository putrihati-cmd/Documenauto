import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, DollarSign } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const PaymentVerification = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState(null); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/pending-payments`);
      setPendingPayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load pending payments:', error);
    }
  };

  const handleVerify = async () => {
    if (!verifyAction) return;

    try {
      setLoading(true);
      await axios.post(`${API_URL}/admin/payments/${selectedPayment.id}/verify`, {
        action: verifyAction,
        notes
      });

      alert(`Payment ${verifyAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowModal(false);
      setNotes('');
      loadPendingPayments();
    } catch (error) {
      console.error('Failed to verify payment:', error);
      alert('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = (payment, action) => {
    setSelectedPayment(payment);
    setVerifyAction(action);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Payment Verification
          </h1>
          <p className="text-gray-600">Verify pending token purchases</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Clock className="w-8 h-8" />}
            label="Pending"
            value={pendingPayments.length}
            color="yellow"
          />
          <StatCard
            icon={<DollarSign className="w-8 h-8" />}
            label="Total Amount"
            value={`Rp ${pendingPayments.reduce((sum, p) => sum + p.price, 0).toLocaleString('id-ID')}`}
            color="green"
          />
          <StatCard
            icon={<CheckCircle className="w-8 h-8" />}
            label="Verified Today"
            value="12"
            color="blue"
          />
        </div>

        {/* Pending Payments List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-2xl font-bold text-white">Pending Payments</h2>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No pending payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Package
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Time
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium">
                          {payment.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-blue-600">
                          {payment.token_amount} tokens
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          Rp {payment.price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: Rp {payment.transfer_amount.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {payment.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.open(payment.payment_proof_url, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Proof"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openVerifyModal(payment, 'approve')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openVerifyModal(payment, 'reject')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {showModal && (
          <VerificationModal
            payment={selectedPayment}
            action={verifyAction}
            notes={notes}
            onNotesChange={setNotes}
            onConfirm={handleVerify}
            onCancel={() => {
              setShowModal(false);
              setNotes('');
            }}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
};

const VerificationModal = ({ payment, action, notes, onNotesChange, onConfirm, onCancel, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`p-6 ${action === 'approve' ? 'bg-green-50' : 'bg-red-50'}`}>
          <h2 className="text-2xl font-bold text-gray-900">
            {action === 'approve' ? 'Approve Payment' : 'Reject Payment'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">Payment Details:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Order #:</span>
                <span className="ml-2 font-mono font-medium">{payment.order_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium">{payment.user.full_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Tokens:</span>
                <span className="ml-2 font-bold text-blue-600">{payment.token_amount}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-bold">Rp {payment.price.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-gray-600">Transfer Amount:</span>
                <span className="ml-2 font-bold">Rp {payment.transfer_amount.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-gray-600">Method:</span>
                <span className="ml-2">{payment.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Payment Proof */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Payment Proof:</h3>
            <img
              src={payment.payment_proof_url}
              alt="Payment proof"
              className="w-full h-64 object-contain bg-gray-100 rounded-lg"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {action === 'approve' ? 'Verification Notes (Optional)' : 'Rejection Reason (Required)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows="3"
              placeholder={action === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Warning */}
          {action === 'approve' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ Tokens will be automatically credited to the user after approval.
              </p>
            </div>
          )}

          {action === 'reject' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ User will be notified and can re-submit payment.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || (action === 'reject' && !notes)}
              className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : action === 'approve' ? 'Approve & Credit Tokens' : 'Reject Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerification;
