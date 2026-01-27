import { useState, useEffect, useRef } from 'react';
import { FileText, Check, ArrowLeft, Loader2, AlertCircle, Split } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

const PreviewViewer = ({ file, orderData, onSubmit, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const containerRef = useRef(null);

  // Generate preview URL for the file
  useEffect(() => {
    if (!file) return;

    let objectUrl = null;

    // PDF or Image
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
       objectUrl = URL.createObjectURL(file);
       setPreviewUrl(objectUrl);
    }
    
    // DOCX Preview
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
       setIsRendering(true);
       setPreviewError(false);
       
       const reader = new FileReader();
       reader.onload = async (e) => {
         const buffer = e.target.result;
         const container = containerRef.current; // access ref directly
         
         if (container) {
           try {
              const { renderAsync } = await import('docx-preview');
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

    // Cleanup
    return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // Helper functions for labels
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
    let basePrice = 500;
    if (orderData.serviceLevel === 'format_print') basePrice = 800;
    else if (orderData.serviceLevel === 'edit_print') basePrice = 1500;

    if (orderData.colorMode) basePrice *= 3;

    const estimatedPages = 10;
    let total = basePrice * estimatedPages * orderData.copies;

    if (orderData.bindingType === 'spiral') total += 5000 * orderData.copies;
    else if (orderData.bindingType === 'hardcover') total += 15000 * orderData.copies;
    else if (orderData.bindingType === 'staple') total += 1000 * orderData.copies;

    return { estimatedPages, basePrice, total: total.toLocaleString('id-ID') };
  };

  const priceInfo = estimatePrice();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Review & Konfirmasi</h2>
          <p className="text-gray-500">Periksa dokumen sebelum diproses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: PREVIEW (BEFORE & AFTER) */}
          <div className="lg:col-span-8 space-y-6">
            
            <ErrorBoundary>
                {/* BEFORE: Original File */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            File Asli (Original)
                        </h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {file.name}
                        </span>
                    </div>
                    
                    <div className="relative min-h-[400px] h-[500px] bg-gray-100/50">
                        {file.type === 'application/pdf' ? (
                        <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                        ) : file.type.startsWith('image/') ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                        ) : file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
                        <div ref={containerRef} className="w-full h-full overflow-auto p-8 bg-white" id="docx-container">
                            {/* DOCX Renders Here */}
                            {isRendering && (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <span className="ml-2 text-gray-500">Memproses preview...</span>
                                </div>
                            )}
                        </div>
                        ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            Preview tidak tersedia
                        </div>
                        )}
                        
                        {previewError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                                <div className="text-center">
                                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Gagal memuat preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AFTER: Simulation / Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
                        <h3 className="font-semibold text-green-800 flex items-center gap-2">
                            <Split className="w-4 h-4" />
                            Hasil Akhir (Estimasi)
                        </h3>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            {getServiceLabel(orderData.serviceLevel)}
                        </span>
                    </div>
                    <div className="p-8 text-center bg-white min-h-[200px] flex flex-col items-center justify-center">
                         <div className="max-w-md mx-auto">
                            <div className="flex justify-center gap-4 mb-4 opacity-50">
                                <FileText className="w-12 h-12 text-gray-300" />
                                <ArrowLeft className="w-8 h-8 text-gray-300 rotate-180" />
                                <FileText className="w-12 h-12 text-green-500 border-2 border-green-200 rounded p-1" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-800 mb-2">
                                Formatting Otomatis akan diterapkan
                            </h4>
                            <p className="text-sm text-gray-500">
                                Sistem kami akan merapikan margin, font, dan spasi dokumen Anda secara otomatis setelah order dikonfirmasi.
                                Anda akan menerima notifikasi WhatsApp saat hasil sudah siap.
                            </p>
                         </div>
                    </div>
                </div>
            </ErrorBoundary>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-4">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-4">Ringkasan Biaya</h3>
                
                <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-gray-600">Layanan</span>
                        <span className="font-medium">{getServiceLabel(orderData.serviceLevel)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                       <span className="text-gray-600">Jumlah</span>
                       <span className="font-medium">{orderData.copies} rangkap</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed">
                       <span className="text-gray-600">Jilid</span>
                       <span className="font-medium">{getBindingLabel(orderData.bindingType)}</span>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                   <p className="text-xs text-blue-600 mb-1">Estimasi Total</p>
                   <p className="text-2xl font-bold text-blue-700">Rp {priceInfo.total}</p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mb-3 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                  Konfirmasi & Bayar
                </button>

                <button
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="w-full py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Kembali
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                    Data Anda dienkripsi dan aman.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PreviewViewer;
