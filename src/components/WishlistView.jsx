import React from 'react';
import { ProductCard } from './UIComponents';
import { Heart } from 'lucide-react';

const WishlistView = ({ 
    wishlist, 
    products, 
    onToggleWishlist, 
    onAddToCart, 
    onChatSeller, 
    onViewProduct, 
    t,
    isSeller // To know if we should show cart/chat buttons (though usually wishlist is for buyers)
}) => {
    // Filter products that are in the wishlist
    const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

    if (wishlistedProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Heart size={40} className="text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {t('wishlist_empty') || "Belum ada produk favorit"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                    {t('wishlist_empty_desc') || "Simpan produk yang Anda suka di sini untuk dilihat nanti."}
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 animate-in fade-in">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500" /> {t('wishlist_title') || "Favorit Saya"}
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
                {wishlistedProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onClick={() => onViewProduct(product)}
                        t={t}
                        isWishlisted={true} // In wishlist view, all are wishlisted
                        onToggleWishlist={onToggleWishlist}
                    />
                ))}
            </div>
        </div>
    );
};

export default WishlistView;
