import { useState, useEffect } from 'react';
import { CreditCard, Wallet, CheckCircle, Clock, Upload, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const BuyTokens = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [step, setStep] = useState('select'); // select, payment, upload, success
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPackages();
    loadPaymentMethods();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await axios.get(`${API_URL}/packages`);
      setPackages(response.data.data || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await axios.get(`${API_URL}/payment-methods`);
      setPaymentMethods(response.data.data || []);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setStep('payment');
  };

  const handleCreateOrder = async () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/payment-orders`, {
        package_id: selectedPackage.id,
        payment_method: selectedMethod.method_type
      });

      setPaymentOrder(response.data.data);
      setStep('upload');
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create payment order');
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile) {
      alert('Please select proof of payment');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('proof', proofFile);
      formData.append('transfer_amount', selectedPackage.price);
      formData.append('transfer_date', new Date().toISOString());

      await axios.post(
        `${API_URL}/payment-orders/${paymentOrder.id}/proof`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setStep('success');
    } catch (error) {
      console.error('Failed to upload proof:', error);
      alert('Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Beli Token
          </h1>
          <p className="text-gray-600">Pilih paket token yang sesuai dengan kebutuhan Anda</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={step} />
        </div>

        {/* Content based on step */}
        {step === 'select' && (
          <PackageSelection 
            packages={packages}
            onSelect={handleSelectPackage}
          />
        )}

        {step === 'payment' && (
          <PaymentMethodSelection
            selectedPackage={selectedPackage}
            paymentMethods={paymentMethods}
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
            onProceed={handleCreateOrder}
            onBack={() => setStep('select')}
          />
        )}

        {step === 'upload' && (
          <UploadProof
            paymentOrder={paymentOrder}
            selectedMethod={selectedMethod}
            proofFile={proofFile}
            onFileSelect={setProofFile}
            onUpload={handleUploadProof}
            uploading={uploading}
            onBack={() => setStep('payment')}
          />
        )}

        {step === 'success' && (
          <SuccessPage
            paymentOrder={paymentOrder}
            onBackToHome={() => window.location.href = '/'}
          />
        )}
      </div>
    </div>
  );
};

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { id: 'select', label: 'Pilih Paket' },
    { id: 'payment', label: 'Metode Pembayaran' },
    { id: 'upload', label: 'Upload Bukti' },
    { id: 'success', label: 'Selesai' }
  ];

  const stepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-2 ${
            index <= stepIndex ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              index <= stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {index < stepIndex ? '✓' : index + 1}
            </div>
            <span className="hidden md:block font-medium">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-1 mx-2 ${
              index < stepIndex ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

const PackageSelection = ({ packages, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {packages.map(pkg => (
        <div
          key={pkg.id}
          className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
            pkg.is_popular ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onSelect(pkg)}
        >
          {pkg.is_popular && (
            <div className="mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                PALING POPULER
              </span>
            </div>
          )}

          <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
          
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-blue-600">
                {pkg.token_amount + pkg.bonus_tokens}
              </span>
              <span className="text-gray-600">tokens</span>
            </div>
            {pkg.bonus_tokens > 0 && (
              <p className="text-sm text-green-600 font-medium">
                + {pkg.bonus_tokens} bonus tokens!
              </p>
            )}
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-900">
              Rp {pkg.price.toLocaleString('id-ID')}
            </div>
            {pkg.discount_percentage > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 line-through">
                  Rp {pkg.original_price.toLocaleString('id-ID')}
                </span>
                <span className="text-green-600 font-bold">
                  Save {pkg.discount_percentage}%!
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

          {pkg.valid_days && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Clock className="w-4 h-4" />
              Valid for {pkg.valid_days} days
            </div>
          )}

          <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
            Pilih Paket
          </button>
        </div>
      ))}
    </div>
  );
};

const PaymentMethodSelection = ({ selectedPackage, paymentMethods, selectedMethod, onSelectMethod, onProceed, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Metode Pembayaran</h2>
        <p className="text-gray-600 mb-6">
          Anda membeli: <strong>{selectedPackage.name}</strong> - {selectedPackage.token_amount + selectedPackage.bonus_tokens} tokens
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {paymentMethods.map(method => (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                selectedMethod?.id === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {method.method_type === 'bank_transfer' ? `Transfer ${method.bank_name}` : 
                     method.method_type === 'qris' ? 'QRIS' : 'Cash di Toko'}
                  </h3>
                  {method.method_type === 'bank_transfer' && (
                    <div className="text-sm text-gray-600">
                      <p>{method.account_number}</p>
                      <p>a.n. {method.account_name}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{method.instructions}</p>
                </div>
                {selectedMethod?.id === method.id && (
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Kembali
          </button>
          <button
            onClick={onProceed}
            disabled={!selectedMethod}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};

const UploadProof = ({ paymentOrder, selectedMethod, proofFile, onFileSelect, onUpload, uploading, onBack }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Bukti Pembayaran</h2>

        {/* Payment Details */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-2">Detail Pembayaran:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-mono font-bold">{paymentOrder.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jumlah:</span>
              <span className="font-bold text-blue-600">Rp {paymentOrder.price.toLocaleString('id-ID')}</span>
            </div>
            {selectedMethod.method_type === 'bank_transfer' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{selectedMethod.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Rekening:</span>
                  <span className="font-mono">{selectedMethod.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Atas Nama:</span>
                  <span className="font-medium">{selectedMethod.account_name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bukti Pembayaran (JPG, PNG, or PDF)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!proofFile ? (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drop file di sini atau klik untuk browse</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => onFileSelect(e.target.files[0])}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                >
                  Pilih File
                </label>
              </>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-medium">{proofFile.name}</span>
                </div>
                <button
                  onClick={() => onFileSelect(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Kembali
          </button>
          <button
            onClick={onUpload}
            disabled={!proofFile || uploading}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SuccessPage = ({ paymentOrder, onBackToHome }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Pembayaran Berhasil Diupload!
        </h2>

        <p className="text-gray-600 mb-8">
          Bukti pembayaran Anda sedang diverifikasi oleh staff kami.
          Token akan otomatis masuk setelah pembayaran dikonfirmasi.
        </p>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Detail Order:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-mono font-bold">{paymentOrder.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Token yang akan didapat:</span>
              <span className="font-bold text-blue-600">{paymentOrder.total_tokens} tokens</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-800">
            ⏱️ Proses verifikasi biasanya memakan waktu 5-30 menit.
            Anda akan mendapat notifikasi setelah token dikreditkan.
          </p>
        </div>

        <button
          onClick={onBackToHome}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

export default BuyTokens;
