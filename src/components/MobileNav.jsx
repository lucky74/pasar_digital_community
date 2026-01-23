import React from 'react';
import { Home, ShoppingCart, MessageCircle, User } from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab, t }) {
  const _t = t || ((k) => k);
  
  const navItems = [
    { id: 'market', icon: Home, label: 'Market' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart' }, // key 'nav_cart' usually
    { id: 'chat', icon: MessageCircle, label: 'Chat' }, // key 'nav_chat'
    { id: 'profile', icon: User, label: 'Profile' }   // key 'nav_profile'
  ];

  // Map IDs to translation keys if needed, or just use the label if t supports it
  // Assuming t keys: 'market', 'cart_title', 'chat_title', 'profile_title' or similar.
  // In translations.js we have: cart_title, chat_title, profile_title. 
  // For market, we have 'app_name' but maybe no specific 'Market' label? 
  // Let's check translations.js content again.
  // We have 'cat_all' etc.
  // Let's assume standard labels for now or keys.
  
  const getLabel = (id) => {
      if (id === 'market') return "Market";
      if (id === 'cart') return _t('cart_title').split(' ')[0]; // "Keranjang"
      if (id === 'chat') return _t('chat_title');
      if (id === 'profile') return _t('profile_title').split(' ')[0]; // "Profil"
      return id;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-50 transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition duration-300 ${
              isActive 
                ? 'text-teal-600 dark:text-teal-400 -translate-y-2' 
                : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <div className={`p-2 rounded-full transition-all duration-300 ${isActive ? 'bg-teal-50 dark:bg-teal-900/30 shadow-sm' : ''}`}>
                <item.icon size={24} className={isActive ? "fill-teal-600 dark:fill-teal-400" : ""} />
            </div>
            {isActive && (
                <span className="text-[10px] font-bold animate-in fade-in slide-in-from-bottom-2">
                    {getLabel(item.id)}
                </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
