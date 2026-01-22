import React from 'react';
import { ShoppingBag, User } from 'lucide-react';

// Tampilan Kartu Produk
export function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full active:scale-95 transition-transform duration-150">
      <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-300 relative">
        <ShoppingBag size={32} />
        {/* Label 'Baru' */}
        <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full">Baru</span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug">{product.name}</h3>
        <p className="text-blue-600 font-bold text-sm mt-1">{product.price}</p>
        <div className="mt-auto pt-2 flex justify-between items-center border-t border-gray-50">
          <div className="flex items-center gap-1">
             <User size={10} className="text-gray-400"/>
             <span className="text-[10px] text-gray-500 truncate max-w-[60px]">{product.seller}</span>
          </div>
          <button className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-bold hover:bg-blue-100">
            Beli
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
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
        }`}
      >
        {!isMe && <p className="text-[10px] font-bold text-orange-500 mb-0.5">{message.sender}</p>}
        <p className="leading-relaxed">{message.text}</p>
        <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
