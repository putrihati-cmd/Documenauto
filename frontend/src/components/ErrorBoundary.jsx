import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border-2 border-red-100 text-center">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan Tampilan</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Maaf, sistem mengalami kendala saat memuat komponen ini.
            <br />
            <span className="text-xs text-red-500 font-mono mt-2 block break-all">
              {this.state.error && this.state.error.toString()}
            </span>
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
