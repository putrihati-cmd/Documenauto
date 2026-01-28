import { useState } from 'react';
import { QrCode, Upload, Check, AlertCircle, Copy, Wallet } from 'lucide-react';

const QRISPayment = ({ paymentOrder, onPaymentComplete, methodData }) => {
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Fallback info if methodData is missing
  const QRIS_INFO = {
    merchantName: methodData?.account_name || 'HS PRINT & COPY CENTER',
    nmid: methodData?.account_number || 'ID1025446029569', // Stored in account_number for QRIS
    qrCodeUrl: methodData?.qris_image_path || '/img/qris-toko.jpg',
    whatsapp: '6285156316239' // Updated to client's WA if known, else default
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar (JPG, PNG, dll)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }

      setProofImage(file);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!proofImage) {
      setError('Pilih bukti transfer terlebih dahulu');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('proof', proofImage);
      // Optional: Send transfer amount if user inputs it, otherwise assume exact match
      formData.append('transfer_amount', paymentOrder.price);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/payment-orders/${paymentOrder.id}/proof`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal upload bukti transfer');
      }

      setUploadSuccess(true);
      
      // Notify parent component after delay
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Gagal upload bukti transfer');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('NMID disalin ke clipboard!');
  };

  if (uploadSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Bukti Transfer Diterima!
        </h3>
        <p className="text-gray-600 mb-6">
          Staff kami akan memverifikasi pembayaran Anda secepatnya.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pembayaran QRIS
        </h2>
        <p className="text-gray-600">
          Scan QR Code dengan aplikasi e-wallet atau mobile banking Anda
        </p>
      </div>

      {/* Total Amount */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-center mb-6">
        <p className="text-white text-sm mb-1">Total Pembayaran</p>
        <p className="text-white text-4xl font-bold">
          {formatCurrency(paymentOrder.price)}
        </p>
        <p className="text-blue-100 text-sm mt-2">
          Order ID: {paymentOrder.order_number}
        </p>
      </div>

      {/* QRIS Code Display */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl border-4 border-gray-200 shadow-lg relative">
            <img 
              src={QRIS_INFO.qrCodeUrl} 
              alt="QRIS Code"
              className="w-80 h-auto"
            />
          </div>
        </div>

        {/* Merchant Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Merchant:</span>
            <span className="text-sm font-semibold text-gray-900">
              {QRIS_INFO.merchantName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">NMID:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-900">
                {QRIS_INFO.nmid}
              </span>
              <button
                onClick={() => copyToClipboard(QRIS_INFO.nmid)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Cara Pembayaran:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Buka aplikasi e-wallet/banking</li>
                <li>Scan QR Code di atas</li>
                <li>Pastikan nominal: <strong>{formatCurrency(paymentOrder.price)}</strong></li>
                <li>Screenshot bukti transfer</li>
            </ol>
        </div>
      </div>

      {/* Upload Proof Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Bukti Transfer
        </h3>

        {/* File Input */}
        <div className="mb-6">
          <label className="block">
            <div className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${proofPreview 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }
            `}>
              {proofPreview ? (
                <div className="space-y-4">
                  <img 
                    src={proofPreview} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Bukti siap diupload
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProofImage(null);
                      setProofPreview(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Ganti gambar
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Upload Bukti Screenshot
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!proofImage || uploading}
          className={`
            w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
            ${proofImage && !uploading
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {uploading ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}
        </button>
      </div>
    </div>
  );
};

export default QRISPayment;
