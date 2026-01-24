import React from 'react';
import { Star, Trash2, Eye, MapPin, ExternalLink, Heart } from 'lucide-react';

export const StarRating = ({ rating }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}
        />
      ))}
    </div>
  );
};

export const ProductCard = ({ product, onClick, t, isWishlisted, onToggleWishlist }) => {
    const _t = t || ((k) => k);
    return (
        <div 
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden active:scale-95 transition duration-200 relative group"
        >
            <div className="relative h-32 bg-gray-200 dark:bg-gray-700">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
                
                {/* Wishlist Button - Zalora Style (Top Right) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist && onToggleWishlist(product);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full shadow-sm z-10 hover:bg-white dark:hover:bg-black transition"
                >
                    <Heart 
                        size={16} 
                        className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"} 
                    />
                </button>

                {product.is_new && (
                    <span className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        {_t('new_label')}
                    </span>
                )}
            </div>
            <div className="p-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1">{product.name}</h3>
                <p className="text-teal-600 dark:text-teal-400 font-bold text-xs mt-1">{product.price}</p>
                <div className="flex items-center gap-1 mt-2">
                    <StarRating rating={product.rating || 0} />
                    <span className="text-[10px] text-gray-400">({product.review_count || 0})</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                        {/* DEBUG: Force display 0 if null/undefined */}
                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-1 rounded">
                            {product.sold_count !== undefined && product.sold_count !== null ? product.sold_count : 0} {_t('sold_count')}
                        </span>
                        <div className="flex items-center gap-0.5 text-gray-400">
                             <Eye size={10} />
                             <span className="text-[10px]">{product.views || 0}</span>
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{product.seller}</span>
                </div>
            </div>
        </div>
    );
};

export const DateSeparator = ({ date, t }) => {
    const _t = t || ((k) => k);
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label = messageDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (messageDate.toDateString() === today.toDateString()) {
        label = _t('today');
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
        label = _t('yesterday');
    }

    return (
        <div className="flex justify-center my-4 sticky top-0 z-10">
            <span className="bg-gray-200/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-600 dark:text-gray-300 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-gray-300 dark:border-gray-600">
                {label}
            </span>
        </div>
    );
};

export const ChatBubble = ({ message, isMe, t, showSender }) => {
    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4 animate-in slide-in-from-bottom-2`}>
            {showSender && !isMe && (
                 <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-1 ml-2">{message.sender}</span>
            )}
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                isMe 
                ? 'bg-teal-500 text-white rounded-br-none shadow-md' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
            }`}>
                {message.image_url && (
                    <img src={message.image_url} alt="attachment" className="w-full rounded-lg mb-2" />
                )}
                {message.location_lat && message.location_lng && (
                    <div className="mb-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <MapPin size={16} className="text-red-500" />
                            </div>
                            <span className="font-bold text-xs text-gray-700 dark:text-gray-200">Lokasi Pengiriman</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 font-mono">
                            {message.location_lat.toFixed(6)}, {message.location_lng.toFixed(6)}
                        </p>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${message.location_lat},${message.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 w-full bg-white dark:bg-gray-800 py-1.5 rounded-md text-xs font-bold text-teal-600 shadow-sm border border-gray-100 dark:border-gray-600 hover:bg-gray-50 transition"
                        >
                            <ExternalLink size={12} /> Buka Google Maps
                        </a>
                    </div>
                )}
                <p>{message.text}</p>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};
