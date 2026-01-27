import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Package, MessageSquare, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const OrderForm = ({ file, onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    documentType: '', // This will now hold the template ID if a specific template is selected, or category
    templateId: null, // New field for specific template logic
    serviceLevel: '',
    copies: 1,
    bindingType: 'none',
    colorMode: false,
    notes: ''
  });

  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await axios.get(`${API_URL}/templates`);
      setAvailableTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Group templates by category
  const groupedTemplates = availableTemplates.reduce((acc, template) => {
    const cat = template.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {});

  const documentCategories = [
    { value: 'skripsi', label: 'Skripsi', description: 'Format akademik standar', icon: '🎓' },
    { value: 'makalah', label: 'Makalah', description: 'Paper & assignment', icon: '📄' },
    { value: 'tesis', label: 'Tesis', description: 'Thesis & dissertation', icon: '📚' },
    { value: 'laporan', label: 'Laporan', description: 'Report & proposal', icon: '📊' },
    { value: 'jurnal', label: 'Jurnal', description: 'Scientific journal', icon: '📝' }
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTemplateSelect = (template) => {
     setFormData(prev => ({
         ...prev,
         documentType: template.category,
         templateId: template.id
     }));
     if (errors.documentType) setErrors(prev => ({ ...prev, documentType: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.documentType) {
      newErrors.documentType = 'Pilih jenis dokumen atau template';
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
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-900 mb-3 tracking-tight">
            Pilih Layanan
          </h2>
          <p className="text-gray-500 text-lg">Sesuaikan dengan kebutuhan dokumen Anda</p>
        </div>

        {/* File Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate text-lg">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Document Type / Template Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <label className="block text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-brand-500 rounded-full block"></span>
              Pilih Template Dokumen
            </label>
            
            {loadingTemplates ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-gray-500 text-sm">Memuat template...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {documentCategories.map((category) => {
                        const hasTemplates = groupedTemplates[category.value]?.length > 0;
                        return (
                            <div key={category.value} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-brand-300 transition-colors">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">{category.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{category.label}</h4>
                                        <p className="text-xs text-gray-500">{category.description}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {hasTemplates ? (
                                        groupedTemplates[category.value].map(template => (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => handleTemplateSelect(template)}
                                                className={`
                                                    text-left p-3 rounded-lg border text-sm transition-all flex items-center justify-between group
                                                    ${formData.templateId === template.id 
                                                        ? 'border-brand-500 bg-white shadow-md ring-1 ring-brand-500' 
                                                        : 'border-gray-200 bg-white hover:border-brand-400 hover:shadow-sm'
                                                    }
                                                `}
                                            >
                                                <span className={`font-medium ${formData.templateId === template.id ? 'text-brand-700' : 'text-gray-700'}`}>
                                                  {template.name}
                                                </span>
                                                {template.is_default && (
                                                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                                                    Default
                                                  </span>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <button
                                             type="button"
                                             onClick={() => {
                                                 setFormData(prev => ({ ...prev, documentType: category.value, templateId: null }));
                                                 if (errors.documentType) setErrors(prev => ({ ...prev, documentType: '' }));
                                             }}
                                             className={`
                                                text-left p-3 rounded-lg border text-sm transition-all border-dashed w-full
                                                ${formData.documentType === category.value && !formData.templateId
                                                    ? 'border-brand-500 bg-white text-brand-700 font-medium'
                                                    : 'border-gray-300 text-gray-500 hover:border-brand-400 hover:text-brand-600'
                                                }
                                             `}
                                        >
                                            Gunakan Standar Umum {category.label}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {errors.documentType && (
              <p className="mt-3 text-sm text-red-600 font-medium flex items-center gap-1">
                ⚠️ {errors.documentType}
              </p>
            )}
          </div>

          {/* Service Level Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <label className="block text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-brand-500 rounded-full block"></span>
              Pilih Layanan
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
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-gray-200 hover:border-brand-200 hover:bg-gray-50'
                    }
                  `}
                >
                  {service.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        REKOMENDASI
                      </span>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                    formData.serviceLevel === service.value ? 'bg-brand-100' : 'bg-gray-100'
                  }`}>
                    <Package className={`w-6 h-6 ${
                      formData.serviceLevel === service.value ? 'text-brand-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="font-bold text-gray-900 mb-1">{service.label}</div>
                  <div className="text-sm text-gray-500 mb-4">{service.description}</div>
                  <div className="text-sm font-bold text-brand-700">{service.price}</div>
                </button>
              ))}
            </div>
            {errors.serviceLevel && (
              <p className="mt-3 text-sm text-red-600 font-medium flex items-center gap-1">
                ⚠️ {errors.serviceLevel}
              </p>
            )}
          </div>

          {/* Additional Options (Copies, Binding, Color) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-brand-500 rounded-full block"></span>
              Opsi Tambahan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Eksemplar</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.copies}
                    onChange={(e) => handleChange('copies', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Jilid</label>
                <div className="relative">
                  <select
                    value={formData.bindingType}
                    onChange={(e) => handleChange('bindingType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all appearance-none bg-white cursor-pointer font-medium"
                  >
                    {bindingOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-brand-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.colorMode}
                    onChange={(e) => handleChange('colorMode', e.target.checked)}
                    className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                  />
                  <span className="font-medium text-gray-900">Print Berwarna (Full Color)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <span>Catatan / Instruksi Khusus</span>
              </div>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Contoh: Tolong periksa margin halaman 3, atau tambahkan header khusus..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 shadow-lg hover:shadow-xl transition-all"
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
