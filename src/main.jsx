import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css';

// ERROR BOUNDARY COMPONENT
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = async () => {
     if (confirm('Reset aplikasi untuk memperbaiki error?')) {
        try {
            // Unregister all SWs
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }
            // Clear caches
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            }
            localStorage.clear();
            window.location.reload(true);
        } catch (e) {
            window.location.reload();
        }
     }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-6">Aplikasi mengalami error. Silakan reset untuk memperbaiki.</p>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 w-full max-w-md overflow-auto max-h-40 text-left">
             <code className="text-xs text-red-500 break-all">{this.state.error?.toString()}</code>
          </div>
          <button 
            onClick={this.handleReset}
            className="px-6 py-3 bg-teal-600 text-white rounded-full font-bold shadow-lg hover:bg-teal-700 transition"
          >
            Reset Aplikasi & Perbaiki
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

// FORCE UNREGISTER SW ON MOUNT (KILL SWITCH)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      let unregisterCount = 0;
      for (const registration of registrations) {
        // Only unregister if it's the old/broken one? 
        // Actually, let's aggressively unregister ALL for this version to ensure clean slate.
        // We will rely on VitePWA to re-register the GOOD one later.
        // But if we unregister here, VitePWA might fight with us.
        // BETTER STRATEGY: 
        // We only unregister if we detect a specific flag is MISSING in localStorage
        // indicating this is a fresh start for the fix.
        if (!localStorage.getItem('sw_fixed_v1')) {
             console.log("Forcing SW Unregister for fix...");
             registration.unregister().then(() => {
                 console.log("SW Unregistered");
                 unregisterCount++;
             });
        }
      }
      if (unregisterCount > 0) {
          localStorage.setItem('sw_fixed_v1', 'true');
          window.location.reload(); // Reload to take effect immediately
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
