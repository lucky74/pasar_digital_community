import React from 'react';
import { Star, Trash2, Eye } from 'lucide-react';

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

export const ProductCard = ({ product, onClick, t }) => {
    const _t = t || ((k) => k);
    return (
        <div 
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden active:scale-95 transition duration-200"
        >
            <div className="relative h-32 bg-gray-200 dark:bg-gray-700">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
                {product.is_new && (
                    <span className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
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
                        <span className="text-[10px] text-gray-400">{product.sold_count || 0} {_t('sold_count')}</span>
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

export const ChatBubble = ({ message, isMe, t }) => {
    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4 animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                isMe 
                ? 'bg-teal-500 text-white rounded-br-none shadow-md' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
            }`}>
                {message.image_url && (
                    <img src={message.image_url} alt="attachment" className="w-full rounded-lg mb-2" />
                )}
                <p>{message.text}</p>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};
