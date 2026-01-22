import React from 'react';
import { ShoppingBag, MessageCircle, User, PlusSquare, ShoppingCart } from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab }) {
  const menus = [
    { id: 'market', icon: <ShoppingBag size={22} />, label: 'Pasar' },
    { id: 'cart', icon: <ShoppingCart size={22} />, label: 'Keranjang' }, // New
    { id: 'chat', icon: <MessageCircle size={22} />, label: 'Chat' },
    { id: 'post', icon: <PlusSquare size={26} className="text-blue-600" />, label: 'Jual' },
    { id: 'profile', icon: <User size={22} />, label: 'Akun' },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 h-16 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {menus.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            activeTab === item.id ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'
          }`}
        >
          {item.icon}
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
