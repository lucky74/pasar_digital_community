import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import { X, MapPin, Navigation, Loader2, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, address }) {
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
       <Popup>{address || "Lokasi Pengiriman"}</Popup>
    </Marker>
  );
}

export default function LocationPickerModal({ onClose, onSend, t }) {
    const [position, setPosition] = useState({ lat: -6.200000, lng: 106.816666 }); // Default Jakarta
    const [hasLocation, setHasLocation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [address, setAddress] = useState("");
    const [fetchingAddress, setFetchingAddress] = useState(false);

    useEffect(() => {
        // Auto-detect on open
        handleGetLocation();
    }, []);

    // Reverse Geocoding when position changes
    useEffect(() => {
        if (position) {
            fetchAddress(position.lat, position.lng);
        }
    }, [position]);

    const fetchAddress = async (lat, lng) => {
        setFetchingAddress(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            setAddress(data.display_name || "Lokasi terpilih");
        } catch (error) {
            console.error("Reverse Geo Error:", error);
            setAddress("Lokasi terpilih");
        } finally {
            setFetchingAddress(false);
        }
    };

    // Debounced Auto-Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 3) {
                performSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 800); // 800ms debounce to be polite to the API

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async (query) => {
        setSearching(true);
        try {
            // Added countrycodes=id to prioritize Indonesia and addressdetails=1 for better formatting
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5&addressdetails=1`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setSearching(false);
        }
    };

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

    const handleSearch = (e) => {
        e.preventDefault();
        // Fallback for manual submit (Enter key)
        if (searchQuery.length >= 3) {
            performSearch(searchQuery);
        }
    };

    const handleSelectLocation = (lat, lon, displayName) => {
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setPosition(newPos);
        setHasLocation(true);
        setSearchResults([]);
        setSearchQuery(""); // Optional: clear or keep query
    };

    const handleConfirm = () => {
        if (!position) return;
        onSend({ ...position, label: address });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                            <MapPin className="text-teal-600" />
                            {t('share_location') || "Bagikan Lokasi"}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                            <X size={20} className="dark:text-white" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Cari alamat atau lokasi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        {searching && <Loader2 className="absolute right-3 top-2.5 text-teal-600 animate-spin" size={18} />}
                    </form>

                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || (searchQuery.length >= 3 && !searching && searchResults.length === 0)) && (
                        <div className="absolute left-4 right-4 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto z-[1001]">
                            {searchResults.length > 0 ? (
                                searchResults.map((result, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => handleSelectLocation(result.lat, result.lon, result.display_name)}
                                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0"
                                    >
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{result.display_name.split(',')[0]}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1">{result.display_name}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Tidak ditemukan lokasi "{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="flex-1 relative bg-gray-100">
                    <MapContainer 
                        center={position} 
                        zoom={15} 
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={(pos) => {
                            setPosition(pos);
                            setHasLocation(true);
                        }} address={address} />
                    </MapContainer>
                    
                    {/* Bottom Controls */}
                    <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-col gap-3">
                        {/* Selected Address Card */}
                        {hasLocation && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-start gap-3 animate-in slide-in-from-bottom-2">
                                <MapPin className="text-teal-600 shrink-0 mt-0.5" size={18} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 font-medium">Lokasi Terpilih</p>
                                    <p className="text-sm text-gray-800 dark:text-white line-clamp-2 font-medium">
                                        {fetchingAddress ? "Memuat alamat..." : (address || "Koordinat: " + position.lat.toFixed(4) + ", " + position.lng.toFixed(4))}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button 
                                onClick={handleConfirm}
                                disabled={!hasLocation}
                                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                                {loading ? "Mencari Lokasi..." : (t('share_this_location') || "Kirim Lokasi Ini")}
                            </button>
                            <button 
                                onClick={handleGetLocation}
                                className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg text-gray-600 dark:text-gray-200 hover:text-teal-600 transition border border-gray-100 dark:border-gray-700 flex-shrink-0"
                                title="Lokasi Saya"
                            >
                                <Navigation size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
