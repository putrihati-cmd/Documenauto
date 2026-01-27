import { useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import OrderForm from './components/OrderForm';
import PreviewViewer from './components/PreviewViewer';
import TemplateManager from './components/admin/TemplateManager';
import { CheckCircle, Home } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

// Customer Workflow Component
const CustomerWorkflow = () => {
    const [step, setStep] = useState('upload'); // upload, form, preview, success
    const [file, setFile] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const [submittedOrder, setSubmittedOrder] = useState(null);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setStep('form');
    };

    const handleFormSubmit = (formData) => {
        setOrderData(formData);
        setStep('preview');
    };

    const handleOrderSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', orderData.documentType);
            formData.append('serviceLevel', orderData.serviceLevel);
            formData.append('copies', orderData.copies);
            formData.append('bindingType', orderData.bindingType);
            formData.append('colorMode', orderData.colorMode);
            formData.append('notes', orderData.notes);

            const response = await axios.post(`${API_URL}/orders`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSubmittedOrder(response.data);
            setStep('success');
        } catch (error) {
            console.error('Order submission error:', error);
            alert('Gagal mengirim order. Silakan coba lagi.');
        }
    };

    const handleBackToUpload = () => {
        setStep('upload');
        setFile(null);
        setOrderData(null);
        setSubmittedOrder(null);
    };

    const handleBackToForm = () => setStep('form');
    const handleBackFromPreview = () => setStep('form');

    // Success Page Component
    const SuccessPage = () => (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Berhasil Dikirim!</h2>
                    <p className="text-gray-600 mb-8">Terima kasih. Order Anda sedang dalam antrian dan akan segera diproses oleh tim kami.</p>

                    {submittedOrder && (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-8 text-left">
                            <h3 className="font-semibold text-gray-900 mb-4 text-center">Detail Order</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Order ID:</span>
                                    <span className="font-mono font-semibold text-blue-600">{submittedOrder.orderId || 'ORD-' + Date.now()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Menunggu Review</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Layanan:</span>
                                    <span className="font-medium text-gray-900">
                                        {orderData.serviceLevel === 'print_only' && 'Print Only'}
                                        {orderData.serviceLevel === 'format_print' && 'Format & Print'}
                                        {orderData.serviceLevel === 'edit_print' && 'Edit & Print'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <button onClick={handleBackToUpload} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                        <Home className="w-5 h-5" /> Kembali ke Beranda
                    </button>
                </div>
            </div>
             <style jsx>{`
                @keyframes bounce-in {
                  0% { transform: scale(0); opacity: 0; }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in { animation: bounce-in 0.6s ease-out; }
              `}</style>
        </div>
    );

    return (
        <div className="App">
            {step === 'upload' && <UploadPage onFileSelect={handleFileSelect} />}
            {step === 'form' && <OrderForm file={file} onSubmit={handleFormSubmit} onBack={handleBackToUpload} />}
            {step === 'preview' && <PreviewViewer file={file} orderData={orderData} onSubmit={handleOrderSubmit} onBack={handleBackFromPreview} />}
            {step === 'success' && <SuccessPage />}
        </div>
    );
};

// Main App Component with Routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerWorkflow />} />
        <Route path="/admin/templates" element={<TemplateManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
