import { useState, useEffect, useRef } from 'react';
import { FileText, Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { renderAsync } from 'docx-preview';

const PreviewViewer = ({ file, orderData, onSubmit, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const containerRef = useRef(null);

  // Generate preview URL for the file
  useEffect(() => {
    if (file) {
      // PDF or Image
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
         const url = URL.createObjectURL(file);
         setPreviewUrl(url);
         return () => URL.revokeObjectURL(url);
      }
      
      // DOCX Preview
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
         setIsRendering(true);
         setPreviewError(false);
         
         const reader = new FileReader();
         reader.onload = async (e) => {
           const buffer = e.target.result;
           const container = document.getElementById('docx-container');
           if (container) {
             try {
                // Clear previous content but keep loader if needed (though we handle isRendering)
                container.innerHTML = ''; 
                await renderAsync(buffer, container, null, {
                  className: 'docx-viewer',
                  inWrapper: false,
                  ignoreWidth: false,
                  ignoreHeight: false
                });
             } catch (err) {
                console.error("DOCX Preview Error:", err);
                setPreviewError(true);
             } finally {
                setIsRendering(false);
             }
           }
         };
         reader.readAsArrayBuffer(file);
      }
    }
  }, [file]);

  const getServiceLabel = (value) => {
    const services = {
      'print_only': 'Print Only',
      'format_print': 'Format & Print',
      'edit_print': 'Edit & Print'
    };
    return services[value] || value;
  };

  const getDocumentTypeLabel = (value) => {
    const types = {
      'skripsi': 'Skripsi',
      'makalah': 'Makalah',
      'tesis': 'Tesis',
      'laporan': 'Laporan',
      'lainnya': 'Lainnya'
    };
    return types[value] || value;
  };

  const getBindingLabel = (value) => {
    const bindings = {
      'none': 'Tanpa Jilid',
      'staple': 'Staples',
      'spiral': 'Spiral',
      'hardcover': 'Hardcover'
    };
    return bindings[value] || value;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Submission error:', error);
      setIsSubmitting(false);
    }
  };

  const estimatePrice = () => {
    // Simple price estimation (this would be calculated by backend in production)
    let basePrice = 500; // per page
    
    if (orderData.serviceLevel === 'format_print') {
      basePrice = 800;
    } else if (orderData.serviceLevel === 'edit_print') {
      basePrice = 1500;
    }

    if (orderData.colorMode) {
      basePrice *= 3; // Color is typically 3x more expensive
    }

    // Assume 10 pages for estimation (actual would come from file analysis)
    const estimatedPages = 10;
    let total = basePrice * estimatedPages * orderData.copies;

    // Add binding cost
    if (orderData.bindingType === 'spiral') {
      total += 5000 * orderData.copies;
    } else if (orderData.bindingType === 'hardcover') {
      total += 15000 * orderData.copies;
    } else if (orderData.bindingType === 'staple') {
      total += 1000 * orderData.copies;
    }

    return {
      estimatedPages,
      basePrice,
      total: total.toLocaleString('id-ID')
    };
  };

  const priceInfo = estimatePrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Preview & Konfirmasi
          </h2>
          <p className="text-gray-600">Periksa detail order sebelum submit</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Preview Dokumen
              </h3>
              
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {file.type === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px]"
                    title="PDF Preview"
                    onError={() => setPreviewError(true)}
                  />
                ) : file.type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-full h-auto max-h-[600px] object-contain"
                    onError={() => setPreviewError(true)}
                  />
                ) : file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                  <div className="h-[600px] bg-white overflow-auto p-4 custom-scrollbar" id="docx-container">
                    {/* DOCX will be rendered here */}
                    {isRendering && (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-500">Memuat preview dokumen...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-gray-500">
                    <div className="text-center space-y-3">
                      <FileText className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="font-medium">Preview tidak tersedia untuk format ini</p>
                      <p className="text-sm">File akan diproses setelah submit</p>
                    </div>
                  </div>
                )}
                
                {previewError && (
                  <div className="h-[600px] flex items-center justify-center absolute inset-0 bg-white">
                    <div className="text-center space-y-3">
                      <AlertCircle className="w-16 h-16 mx-auto text-orange-500" />
                      <p className="font-medium text-gray-700">Gagal memuat preview</p>
                      <p className="text-sm text-gray-500">File akan tetap diproses dengan normal</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Preview ini hanya tampilan awal. Tim kami akan memproses dokumen sesuai dengan layanan yang Anda pilih.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ringkasan Order
              </h3>

              <div className="space-y-4 mb-6">
                {/* File Info */}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">File</p>
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Document Type */}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Jenis Dokumen</p>
                  <p className="font-medium text-gray-900">
                    {getDocumentTypeLabel(orderData.documentType)}
                  </p>
                </div>

                {/* Service Level */}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Layanan</p>
                  <p className="font-medium text-gray-900">
                    {getServiceLabel(orderData.serviceLevel)}
                  </p>
                </div>

                {/* Specifications */}
                <div className="space-y-2 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jumlah:</span>
                    <span className="font-medium">{orderData.copies} eksemplar</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jilid:</span>
                    <span className="font-medium">{getBindingLabel(orderData.bindingType)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Warna:</span>
                    <span className="font-medium">
                      {orderData.colorMode ? 'Full Color' : 'Hitam Putih'}
                    </span>
                  </div>
                </div>

                {/* Price Estimate */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Estimasi Harga</p>
                  <p className="text-xs text-gray-500 mb-2">
                    ~{priceInfo.estimatedPages} halaman × Rp {priceInfo.basePrice.toLocaleString('id-ID')}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    Rp {priceInfo.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    *Harga final akan dikonfirmasi setelah review
                  </p>
                </div>

                {/* Notes */}
                {orderData.notes && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Catatan</p>
                    <p className="text-sm text-gray-700 italic">"{orderData.notes}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Konfirmasi Order
                    </>
                  )}
                </button>

                <button
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-800 text-center">
                  🔒 Dokumen Anda aman dan terlindungi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewViewer;
