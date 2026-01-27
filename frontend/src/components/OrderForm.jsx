import { useState } from 'react';
import { FileText, Package, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';

const OrderForm = ({ file, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    documentType: '',
    serviceLevel: '',
    copies: 1,
    bindingType: 'none',
    colorMode: false,
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const documentTypes = [
    { value: 'skripsi', label: 'Skripsi', description: 'Format akademik standar' },
    { value: 'makalah', label: 'Makalah', description: 'Paper & assignment' },
    { value: 'tesis', label: 'Tesis', description: 'Thesis & dissertation' },
    { value: 'laporan', label: 'Laporan', description: 'Report & proposal' },
    { value: 'lainnya', label: 'Lainnya', description: 'Dokumen umum' }
  ];

  const serviceLevels = [
    {
      value: 'print_only',
      label: 'Print Only',
      description: 'Langsung print tanpa editing',
      price: 'Mulai Rp 500/lembar'
    },
    {
      value: 'format_print',
      label: 'Format & Print',
      description: 'Auto-format margin, font, spacing',
      price: 'Mulai Rp 800/lembar',
      recommended: true
    },
    {
      value: 'edit_print',
      label: 'Edit & Print',
      description: 'Editing lengkap + review staff',
      price: 'Mulai Rp 1,500/lembar'
    }
  ];

  const bindingOptions = [
    { value: 'none', label: 'Tanpa Jilid' },
    { value: 'staple', label: 'Staples' },
    { value: 'spiral', label: 'Spiral' },
    { value: 'hardcover', label: 'Hardcover' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user makes a change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.documentType) {
      newErrors.documentType = 'Pilih jenis dokumen';
    }

    if (!formData.serviceLevel) {
      newErrors.serviceLevel = 'Pilih layanan yang diinginkan';
    }

    if (formData.copies < 1 || formData.copies > 100) {
      newErrors.copies = 'Jumlah eksemplar harus 1-100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Pilih Layanan
          </h2>
          <p className="text-gray-600">Sesuaikan dengan kebutuhan Anda</p>
        </div>

        {/* File Info */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8 flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Document Type Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Jenis Dokumen *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('documentType', type.value)}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${formData.documentType === type.value
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </button>
              ))}
            </div>
            {errors.documentType && (
              <p className="mt-2 text-sm text-red-600">{errors.documentType}</p>
            )}
          </div>

          {/* Service Level Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Pilih Layanan *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {serviceLevels.map((service) => (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => handleChange('serviceLevel', service.value)}
                  className={`
                    relative p-6 rounded-xl border-2 text-left transition-all duration-200
                    ${formData.serviceLevel === service.value
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {service.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        REKOMENDASI
                      </span>
                    </div>
                  )}
                  <Package className={`w-8 h-8 mb-3 ${
                    formData.serviceLevel === service.value ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="font-semibold text-gray-900 mb-2">{service.label}</div>
                  <div className="text-sm text-gray-600 mb-3">{service.description}</div>
                  <div className="text-sm font-medium text-blue-600">{service.price}</div>
                </button>
              ))}
            </div>
            {errors.serviceLevel && (
              <p className="mt-2 text-sm text-red-600">{errors.serviceLevel}</p>
            )}
          </div>

          {/* Additional Options */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Opsi Tambahan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Copies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Eksemplar
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.copies}
                  onChange={(e) => handleChange('copies', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {errors.copies && (
                  <p className="mt-1 text-sm text-red-600">{errors.copies}</p>
                )}
              </div>

              {/* Binding Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Jilid
                </label>
                <select
                  value={formData.bindingType}
                  onChange={(e) => handleChange('bindingType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                >
                  {bindingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Mode */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.colorMode}
                    onChange={(e) => handleChange('colorMode', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Print Berwarna (Full Color)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span>Catatan / Instruksi Khusus</span>
              </div>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Contoh: Tolong periksa margin halaman 3, atau tambahkan header khusus..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Lanjut ke Preview
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
