import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import { X, MapPin, Navigation, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}>
       <Popup>Lokasi Pengiriman</Popup>
    </Marker>
  );
}

export default function LocationPickerModal({ onClose, onSend, t }) {
    const [position, setPosition] = useState({ lat: -6.200000, lng: 106.816666 }); // Default Jakarta
    const [hasLocation, setHasLocation] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Auto-detect on open
        handleGetLocation();
    }, []);

    const handleGetLocation = () => {
        setLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition({ lat: latitude, lng: longitude });
                setHasLocation(true);
                setLoading(false);
            }, (err) => {
                console.error("Geo Error:", err);
                setLoading(false);
                // Keep default Jakarta
            });
        } else {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!position) return;
        onSend(position);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
                    <div>
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                            <MapPin className="text-teal-600" />
                            {t('share_location') || "Bagikan Lokasi"}
                        </h3>
                        <p className="text-xs text-gray-500">Geser peta & klik untuk memilih titik pengiriman</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                        <X size={20} className="dark:text-white" />
                    </button>
                </div>

                {/* Map */}
                <div className="flex-1 relative bg-gray-100">
                    <MapContainer 
                        center={position} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={(pos) => {
                            setPosition(pos);
                            setHasLocation(true);
                        }} />
                    </MapContainer>

                    {/* Floating Controls */}
                    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                        <button 
                            onClick={handleGetLocation}
                            className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg text-teal-600 hover:bg-gray-50 transition"
                            title="Lokasi Saya"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                            <MapPin className="text-teal-600 dark:text-teal-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Lokasi Terpilih</p>
                            <p className="text-sm font-medium dark:text-white">
                                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                            </p>
                        </div>
                     </div>
                     <button 
                        onClick={handleConfirm}
                        className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition active:scale-95"
                     >
                        Kirim Lokasi Ini
                     </button>
                </div>
            </div>
        </div>
    );
};
