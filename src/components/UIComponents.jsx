import React from 'react';
import { ShoppingBag, User, Share2, MessageCircle, Trash2, Edit, Star } from 'lucide-react';

// Tampilan Rating Bintang
export function StarRating({ rating, setRating, readOnly = false, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          } ${!readOnly ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          onClick={() => !readOnly && setRating && setRating(star)}
        />
      ))}
    </div>
  );
}

// Tampilan Kartu Produk
export function ProductCard({ product, onChat, onAddToCart, onDelete, onEdit, isOwner, onClick }) {
  const [qty, setQty] = React.useState(1);

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?pid=${product.id}`;
    const shareText = `*${product.name}*\nHarga: ${product.price}\nPenjual: ${product.seller}\n\nLihat foto & beli disini 👇\n${shareUrl}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: product.name,
                text: shareText,
                url: shareUrl,
            });
        } catch (err) {
            console.log('Share canceled:', err);
        }
    } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product, qty);
      setQty(1); // Reset qty
    }
  };

  const handleBuy = () => {
     if (onChat) {
       onChat(product.seller);
     } else {
       alert('Silahkan Login atau Buka menu Chat untuk menghubungi penjual: ' + product.seller);
     }
  };

  return (
    <div 
      onClick={() => onClick && onClick(product)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full active:scale-95 transition-transform duration-150 cursor-pointer"
    >
      <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-300 relative group overflow-hidden">
        {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
            <ShoppingBag size={32} />
        )}
        {/* Label 'Baru' */}
        <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full">Baru</span>
        
        {/* Tombol Hapus & Edit (Khusus Pemilik) */}
        {isOwner && (
            <div className="absolute top-2 left-2 flex gap-1 z-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                    className="bg-yellow-500 text-white p-1.5 rounded-full shadow-sm hover:bg-yellow-600 transition"
                    title="Edit Produk"
                >
                    <Edit size={14} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                    className="bg-red-500 text-white p-1.5 rounded-full shadow-sm hover:bg-red-600 transition"
                    title="Hapus Produk"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        )}
        
        {/* Tombol Share Overlay */}
        <button 
           onClick={handleShare}
           className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm text-green-600 hover:bg-green-50 transition z-20"
        >
           <Share2 size={14} />
        </button>
        
        {/* Hint Klik (Optional) */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors z-0" />
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex justify-between items-center mt-1">
            <p className="text-teal-600 font-bold text-sm">{product.price}</p>
            {/* Rating Preview */}
            <div className="flex items-center gap-1">
                <Star size={10} className={`${(product.rating || 0) > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                <span className="text-[10px] text-gray-500">{(product.rating || 0).toFixed(1)}</span>
            </div>
        </div>
        
        {/* Quantity Selector */}
        <div className="mt-2 flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }} className="w-6 h-6 bg-gray-100 rounded text-gray-600 font-bold">-</button>
            <span className="text-xs font-medium w-4 text-center">{qty}</span>
            <button onClick={(e) => { e.stopPropagation(); setQty(qty + 1); }} className="w-6 h-6 bg-gray-100 rounded text-gray-600 font-bold">+</button>
        </div>

        <div className="mt-auto pt-2 flex justify-between items-center border-t border-gray-50 mt-2">
          <button onClick={handleAddToCart} className="text-[10px] bg-orange-50 text-orange-600 px-3 py-1.5 rounded-md font-bold hover:bg-orange-100 flex items-center gap-1 transition">
            + Keranjang
          </button>
          <button onClick={handleBuy} className="text-[10px] bg-teal-50 text-teal-600 px-3 py-1.5 rounded-md font-bold hover:bg-teal-100 flex items-center gap-1 transition">
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}

// Tampilan Chat
export function ChatBubble({ message, isMe }) {
  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative ${
          isMe
            ? 'bg-teal-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
        }`}
      >
        {!isMe && <p className="text-[10px] font-bold text-orange-500 mb-0.5">{message.sender}</p>}
        <p className="leading-relaxed">{message.text}</p>
        <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
