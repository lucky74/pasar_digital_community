import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { translations } from './translations';
import MobileNav from './components/MobileNav';
import { ProductCard, ChatBubble, StarRating } from './components/UIComponents';
import { LogOut, Send, Search, Bell, ArrowLeft, MessageSquare, Trash2, Star, Camera, X, Eye, EyeOff, MessageCircle, BarChart3, Package, Users, Moon, Sun, Globe, Filter, Plus, Minus, Upload, ShoppingCart } from 'lucide-react';

// --- MODAL TAMBAH PRODUK ---
const AddProductModal = ({ onClose, user, showToast, t, CATEGORY_KEYS }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(CATEGORY_KEYS[1]); // Default to first actual category
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast(t('alert_file_size_5mb'), 'error');
                return;
            }
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return showToast(t('alert_login_chat'), 'error');
        
        setUploading(true);
        let publicUrl = null;

        try {
            // Upload Image
            if (image) {
                const fileExt = image.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;
                
                const { error: uploadError } = await supabase.storage.from('products').upload(filePath, image);
                
                if (uploadError) {
                    if (uploadError.message.includes("Bucket not found")) {
                        throw new Error(t('alert_bucket_products_missing'));
                    }
                    throw uploadError;
                }

                const { data } = supabase.storage.from('products').getPublicUrl(filePath);
                publicUrl = data.publicUrl;
            }

            // Insert Product
            const { error } = await supabase.from('products').insert({
                name,
                price: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price),
                category: translations['id'][category], // Store as Indonesian string for consistency
                description,
                image_url: publicUrl,
                seller: user.name,
                views: 0
            });

            if (error) throw error;

            showToast("Produk berhasil diupload!", "success");
            onClose();

        } catch (error) {
            console.error("Upload Error:", error);
            showToast(t('alert_upload_fail') + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Jual Produk Baru</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"><X size={20} className="text-gray-600 dark:text-gray-300" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                    <div className="flex justify-center mb-4">
                        <label className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition group">
                            {image ? (
                                <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <>
                                    <Upload size={32} className="text-gray-400 group-hover:text-teal-500 mb-2" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Upload Foto Produk</span>
                                </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} required />
                        </label>
                    </div>

                    <input type="text" placeholder="Nama Produk" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />
                    
                    <input type="number" placeholder="Harga (Contoh: 50000)" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />

                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white">
                        {CATEGORY_KEYS.filter(k => k !== 'cat_all').map(key => (
                            <option key={key} value={key}>{t(key)}</option>
                        ))}
                    </select>

                    <textarea placeholder="Deskripsi Produk..." value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />

                    <button type="submit" disabled={uploading} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition disabled:opacity-50">
                        {uploading ? t('processing') : 'Mulai Jualan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- MODAL DETAIL PRODUK ---
const ProductDetailModal = ({ viewProduct, setViewProduct, setViewImage, user, showToast, handleAddToCart, handleStartChat, handleDeleteProduct, t }) => {
    const [reviews, setReviews] = useState([]);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const _t = t || ((k) => k);
    const isSeller = user?.name === viewProduct?.seller;

    useEffect(() => {
        if (viewProduct?.id) {
            setQuantity(1); // Reset quantity when product changes
            const incrementView = async () => {
                const { error } = await supabase.rpc('increment_views', { p_id: viewProduct.id });
                if (error) {
                    await supabase.from('products').update({ views: (viewProduct.views || 0) + 1 }).eq('id', viewProduct.id);
                }
            };
            incrementView();
            fetchReviews();
            
            const channel = supabase.channel(`reviews:${viewProduct.id}`)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `product_id=eq.${viewProduct.id}` }, fetchReviews)
              .subscribe();
            return () => supabase.removeChannel(channel);
        }
    }, [viewProduct?.id]);

    const fetchReviews = async () => {
        if (!viewProduct?.id) return;
        const { data } = await supabase.from('reviews').select('*').eq('product_id', viewProduct.id).order('created_at', { ascending: false });
        if (data) setReviews(data);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) return showToast(_t('login_required_review'), 'error');
        if (newRating === 0) return showToast(_t('rating_required'), 'error');

        setSubmittingReview(true);
        const { error } = await supabase.from('reviews').insert({
            product_id: viewProduct.id,
            seller: viewProduct.seller,
            reviewer: user.name, 
            rating: newRating,
            comment: newComment
        });

        if (error) {
            showToast(_t('review_failed') + error.message, 'error');
        } else {
            showToast(_t('review_success'), 'success');
            setNewRating(0);
            setNewComment('');
            setShowReviewForm(false);
        }
        setSubmittingReview(false);
    };

    if (!viewProduct) return null;
    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewProduct(null)}>
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="overflow-y-auto flex-1">
                    <div className="relative h-64 bg-gray-100 dark:bg-gray-800 shrink-0">
                        {viewProduct.image_url ? (
                            <img 
                                src={viewProduct.image_url} 
                                alt={viewProduct.name} 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition" 
                                onClick={(e) => { e.stopPropagation(); setViewImage(viewProduct.image_url); }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Search size={48} /></div>
                        )}
                        <button onClick={() => setViewProduct(null)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"><ArrowLeft size={20} /></button>
                    </div>
                    <div className="p-5">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{viewProduct.name}</h2>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{viewProduct.price}</p>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-lg">
                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{avgRating > 0 ? avgRating : '-'}</span>
                                    <span className="text-xs text-gray-400">({reviews.length} {_t('reviews')})</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{_t('view_count')} {viewProduct.views || 0}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl mb-6 text-sm text-gray-600 dark:text-gray-300">
                            <p className="font-semibold mb-1">{_t('desc_label')}:</p>
                            <p className="whitespace-pre-wrap">{viewProduct.description || "Tidak ada deskripsi."}</p>
                        </div>
                        <div className="flex items-center gap-3 mb-6 p-3 border border-gray-100 dark:border-gray-800 rounded-xl">
                            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
                                {viewProduct.seller.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">{_t('seller_label')}</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">{viewProduct.seller}</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-800 dark:text-gray-100">{_t('reviews')}</h3>
                                <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-xs text-teal-600 font-bold hover:underline">
                                    {showReviewForm ? _t('cancel') : `+ ${_t('write_review')}`}
                                </button>
                            </div>
                            {showReviewForm && (
                                <form onSubmit={handleSubmitReview} className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-xl mb-4">
                                    <div className="flex gap-2 mb-3 justify-center">
                                        {[1,2,3,4,5].map(star => (
                                            <Star key={star} size={24} className={`cursor-pointer ${star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} onClick={() => setNewRating(star)} />
                                        ))}
                                    </div>
                                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Tulis pengalamanmu..." className="w-full p-2 rounded-lg border text-sm mb-2 dark:bg-gray-800 dark:text-white" rows="3" required />
                                    <button type="submit" disabled={submittingReview} className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-bold">
                                        {submittingReview ? _t('processing') : _t('send_review')}
                                    </button>
                                </form>
                            )}
                            <div className="space-y-3">
                                {reviews.length === 0 ? <p className="text-center text-gray-400 text-sm">{_t('no_reviews')}</p> : reviews.map(r => (
                                    <div key={r.id} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{r.reviewer}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-1 mb-1"><StarRating rating={r.rating} /></div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
                        {!isSeller && (
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800 dark:text-gray-200">{_t('quantity') || 'Jumlah'}:</span>
                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-800 dark:text-white">
                                    <Minus size={16} />
                                </button>
                                <span className="font-bold w-8 text-center text-gray-800 dark:text-white">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition text-gray-800 dark:text-white">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        )}
                        <div className="flex gap-3">
                            {isSeller ? (
                                <button onClick={() => handleDeleteProduct(viewProduct)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-none">
                                    <Trash2 size={18} /> {_t('delete_product') || 'Hapus Produk'}
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => handleStartChat(viewProduct.seller)} className="flex-1 border border-teal-600 text-teal-600 dark:text-teal-400 py-3 rounded-xl font-bold text-sm hover:bg-teal-50 dark:hover:bg-teal-900/30 transition flex items-center justify-center gap-2">
                                        <MessageSquare size={18} /> {_t('chat_seller')}
                                    </button>
                                    <button onClick={() => handleAddToCart(viewProduct, quantity)} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition flex items-center justify-center gap-2 shadow-lg shadow-teal-200 dark:shadow-none">
                                        <ShoppingCart size={18} /> {_t('add_to_cart')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
            </div>
        </div>
    );
};

const ImageViewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full"><X size={24}/></button>
            <img src={imageUrl} alt="Full View" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
    );
};

const CATEGORY_KEYS = [
  "cat_all", "cat_food", "cat_drink", "cat_fashion", "cat_cosmetic", "cat_household",
  "cat_baby", "cat_toys", "cat_education", "cat_others"
];

export default function App() {
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('market');
    const [viewProduct, setViewProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [chatPartner, setChatPartner] = useState(null);
    const [viewImage, setViewImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('cat_all');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'id');
    const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
    
    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const t = (key) => translations[language][key] || key;

    // Dark Mode Effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('app_theme', theme);
    }, [theme]);

    // Language Effect
    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    // Check Auth
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profile) setUser({ ...user, name: profile.username });
            }
        };
        checkUser();
    }, []);

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (data) setProducts(data);
        };
        fetchProducts();
        
        const channel = supabase.channel('products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    // Fetch Messages
    useEffect(() => {
        if (!user) return;
        const fetchMessages = async () => {
            const { data } = await supabase.from('messages').select('*').or(`sender.eq.${user.name},receiver.eq.${user.name}`).order('created_at', { ascending: true });
            if (data) setMessages(data);
        };
        fetchMessages();

        const channel = supabase.channel('messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver=eq.${user.name}` }, payload => {
                setMessages(prev => [...prev, payload.new]);
                showToast(`New message from ${payload.new.sender}`, 'info');
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user]);

    // Helper Functions
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const toggleLanguage = () => setLanguage(prev => prev === 'id' ? 'en' : 'id');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes("Email not confirmed")) {
                showToast(t('alert_email_not_confirmed'), 'error');
            } else if (error.message.includes("Invalid login credentials")) {
                showToast(t('alert_invalid_login'), 'error');
            } else {
                showToast(error.message, 'error');
            }
        } else {
            let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            
            // Zombie Account Recovery: If auth exists but profile is missing
            if (!profile) {
                const fallbackUsername = data.user.user_metadata?.username || data.user.email.split('@')[0];
                const { error: createError } = await supabase.from('profiles').insert({
                    id: data.user.id,
                    username: fallbackUsername,
                    email: data.user.email,
                    updated_at: new Date()
                });
                
                if (!createError) {
                    profile = { username: fallbackUsername };
                }
            }

            const displayName = profile?.username || data.user.user_metadata?.username || data.user.email.split('@')[0];
            setUser({ ...data.user, name: displayName });
            showToast(`Welcome ${displayName}!`, 'success');
        }
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (loading) return;

        if (password.length < 6) {
            return showToast("Password minimal 6 karakter.", 'error');
        }

        setLoading(true);

        try {
            // Check if username exists
            const { data: existingUser, error: checkError } = await supabase.from('profiles').select('username').eq('username', username).single();
            
            // Ignore PGRST116 (No rows found) - that means username is available
            if (existingUser) {
                setLoading(false);
                return showToast("Username sudah dipakai. Pilih yang lain.", 'error');
            }

            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { username } }
            });
            
            if (error) {
                // SHOW RAW ERROR for debugging
                console.error("Register Error:", error);
                if (error.message.includes("User already registered")) {
                    showToast(t('alert_user_exists') + " Silakan Login.", 'error');
                } else {
                    // Tampilkan pesan error asli agar jelas penyebabnya
                    showToast(`${error.message}`, 'error'); 
                }
            } else {
                if (data.user) {
                    // Check if identity is already linked (rare case)
                    if (data.user.identities && data.user.identities.length === 0) {
                         showToast(t('alert_user_exists'), 'error');
                         setLoading(false);
                         return;
                    }

                    const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, username, email });
                    if (profileError) {
                        showToast("Gagal membuat profil: " + profileError.message, 'error');
                    } else {
                        showToast(t('success_register'), 'success');
                        setIsRegister(false);
                    }
                }
            }
        } catch (err) {
            console.error("Unexpected Error:", err);
            showToast("Error Tak Terduga: " + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setCart([]);
        setMessages([]);
        setActiveTab('market');
        localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token'); // Attempt cleanup
        window.location.reload(); // Force reload to clear memory/cache
    };

    const handleDeleteAccount = async () => {
        if (!confirm(t('delete_account_warning'))) return;
        const confirmText = prompt(t('delete_account_final'));
        if (confirmText !== 'DELETE') return;

        setLoading(true);
        try {
            // 1. Delete User's Products
            const { error: prodError } = await supabase.from('products').delete().eq('seller', user.name);
            if (prodError) console.error("Error deleting products:", prodError); // Log but continue

            // 2. Delete User's Messages (Sent & Received)
            const { error: msgError } = await supabase.from('messages').delete().or(`sender.eq.${user.name},receiver.eq.${user.name}`);
            if (msgError) console.error("Error deleting messages:", msgError); // Log but continue

            // 3. Delete User's Profile
            const { error: profError } = await supabase.from('profiles').delete().eq('id', user.id);
            if (profError) console.error("Error deleting profile:", profError); // Log but continue

            // 4. Delete Auth User (The Real Deletion) via RPC
            const { error: rpcError } = await supabase.rpc('delete_own_user');
            
            // If RPC fails (e.g. function not found), try standard signOut but warn user
            if (rpcError) {
                console.error("RPC delete_own_user failed:", rpcError);
                await supabase.auth.signOut();
                showToast("Akun dihapus sebagian. Hubungi admin untuk penghapusan total.", 'warning');
            } else {
                await supabase.auth.signOut(); // Ensure client side is cleared
                showToast(t('alert_account_deleted'), 'success');
            }

            handleLogout();
            
        } catch (error) {
            console.error("Delete Account Error:", error);
            showToast(t('alert_delete_account_fail') + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast(t('alert_file_size_2mb'), 'error');
            return;
        }

        setUploadingAvatar(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.name}_avatar_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

            if (uploadError) {
               if (uploadError.message.includes("Bucket not found") || uploadError.statusCode === "404") {
                   showToast(t('alert_bucket_avatars_missing'), 'error');
                   setUploadingAvatar(false);
                   return;
               }
               throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = publicUrlData.publicUrl;

            const { error: dbError } = await supabase.from('profiles').upsert({ 
                username: user.name, 
                email: user.email, 
                avatar_url: publicUrl,
                updated_at: new Date()
            }, { onConflict: 'username' });

            if (dbError) throw dbError;

            setUser(prev => ({ ...prev, avatar_url: publicUrl }));
            showToast(t('alert_avatar_success'), 'success');

        } catch (error) {
            console.error("Avatar Upload Error:", error);
            showToast(t('alert_avatar_fail') + error.message, 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDeleteConversation = async (partnerName) => {
        if (!confirm(t('confirm_delete_chat'))) return;
      
        setLoading(true);
        const { error } = await supabase
            .from('messages')
            .delete()
            .or(`and(sender.eq."${user.name}",receiver.eq."${partnerName}"),and(sender.eq."${partnerName}",receiver.eq."${user.name}")`);
      
        if (error) {
            showToast(t('alert_delete_chat_fail') + error.message, 'error');
        } else {
            setMessages(prev => prev.filter(m => 
                !((m.sender === user.name && m.receiver === partnerName) || 
                  (m.sender === partnerName && m.receiver === user.name))
            ));
            if (chatPartner === partnerName) {
                setChatPartner(null);
            }
        }
        setLoading(false);
    };

    const handleAddToCart = (product, quantity = 1) => {
        if (!user) return showToast(t('alert_cart_add_success'), 'success'); // Guest add to cart simulation
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: (p.quantity || 1) + quantity } : p);
            }
            return [...prev, { ...product, quantity }];
        });
        showToast(t('alert_cart_add_success'), 'success');
    };

    const handleCheckoutViaChat = async (sellerName, items) => {
        if (!user) return showToast(t('login_required_chat') || "Login untuk lanjut", 'error');
        
        // 1. Format Message
        const total = items.reduce((acc, item) => {
             // Fix: Handle "Rp 50.000,00" format by splitting comma first to ignore decimals/cents
             const price = parseInt(item.price.split(',')[0].replace(/[^0-9]/g, '')) || 0;
             return acc + (price * (item.quantity || 1));
        }, 0);
        const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total);
        
        let message = `Halo ${sellerName}, saya ingin memesan produk berikut:\n`;
        items.forEach((item, idx) => {
            message += `${idx + 1}. ${item.name} (${item.quantity || 1}x) - ${item.price}\n`;
        });
        message += `\nTotal: ${formattedTotal}\nMohon info pembayaran dan pengiriman. Terima kasih!`;
    
        // 2. Start Chat & Send Message
        handleStartChat(sellerName); // Sets activeTab to 'chat' and chatPartner
        
        // Pass sellerName explicitly to avoid race condition with state update
        await handleSendMessage(message, null, sellerName);
    
        // 3. Clear items from cart (for this seller)
        setCart(prev => prev.filter(item => item.seller !== sellerName));
        
        showToast("Pesanan dikirim ke chat penjual!", "success");
    };

    const handleDeleteProduct = async (product) => {
        if (!confirm(t('confirm_delete_product') || "Yakin ingin menghapus produk ini?")) return;
        if (user.name !== product.seller) return showToast(t('alert_delete_forbidden') || "Anda tidak berhak menghapus produk ini", 'error');

        setLoading(true);
        try {
            const { error } = await supabase.from('products').delete().eq('id', product.id);
            if (error) throw error;

            setProducts(prev => prev.filter(p => p.id !== product.id));
            if (viewProduct?.id === product.id) setViewProduct(null);
            showToast(t('product_deleted') || "Produk berhasil dihapus", 'success');
        } catch (error) {
            console.error("Delete Product Error:", error);
            showToast(t('alert_delete_fail') + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (text, imageUrl = null, receiverOverride = null) => {
        if (!text && !imageUrl) return;
        
        // Use override if provided (fixes race condition in checkout), otherwise use state
        const receiver = receiverOverride || chatPartner;
        
        if (!receiver) {
            showToast("Error: Penerima tidak ditemukan.", 'error');
            return;
        }

        const newMsg = {
            sender: user.name,
            receiver: receiver,
            text: text,
            is_read: false,
            created_at: new Date().toISOString()
        };

        if (imageUrl) {
            newMsg.image_url = imageUrl;
        }

        // Optimistic UI
        setMessages(prev => [...prev, newMsg]);

        const { error } = await supabase.from('messages').insert(newMsg);
        if (error) {
            showToast(t('alert_chat_send_fail') + error.message, 'error');
            // Revert optimistic update if needed or handle error
        }
    };

    const handleChatImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
             showToast(t('alert_file_size_2mb'), 'error');
             return;
        }

        const fileName = `chat_${Date.now()}_${file.name}`;
        const filePath = `chat_images/${fileName}`;
        
        try {
            const { error: uploadError } = await supabase.storage.from('chat_images').upload(filePath, file);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('chat_images').getPublicUrl(filePath);
            handleSendMessage("", data.publicUrl);
        } catch (error) {
            showToast(t('alert_send_image_fail') + error.message, 'error');
        }
    };

    const handleStartChat = (sellerName) => {
        if (!user) return showToast(t('alert_login_chat'), 'error');
        if (sellerName === user.name) return showToast(t('alert_own_product'), 'error');
        setChatPartner(sellerName);
        setActiveTab('chat');
        setViewProduct(null); // Close the product detail modal so chat is visible
    };

    // --- Views ---
    
    if (!user) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-24 h-24 mx-auto mb-4">
                            <img src="/logo.png" alt="Pasar Digital Logo" className="w-full h-full object-contain drop-shadow-xl" />
                        </div>
                        <h1 className="text-2xl font-bold">{t('app_name')}</h1>
                        <p className="text-gray-400 text-sm">{t('login_subtitle')}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                            <button onClick={() => setIsRegister(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isRegister ? 'bg-white dark:bg-gray-600 shadow-sm text-teal-600 dark:text-white' : 'text-gray-400'}`}>{t('btn_login')}</button>
                            <button onClick={() => setIsRegister(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isRegister ? 'bg-white dark:bg-gray-600 shadow-sm text-teal-600 dark:text-white' : 'text-gray-400'}`}>{t('btn_register')}</button>
                        </div>

                        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4" autoComplete="off">
                            {isRegister && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">Username</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 outline-none transition text-sm dark:text-white" required placeholder="Username" autoComplete="off" />
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">{t('email_label')}</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 outline-none transition text-sm dark:text-white" required placeholder="user@example.com" autoComplete="off" />
                            </div>
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">{t('password_label')}</label>
                                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 outline-none transition text-sm dark:text-white" required placeholder={isRegister ? t('password_placeholder_register') : t('password_placeholder_login')} autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            
                            <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? t('processing') : (isRegister ? t('btn_register') : t('btn_login'))}
                            </button>
                            
                            {!isRegister && (
                                <p className="text-xs text-center text-gray-400 mt-4 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                                    <span className="font-bold text-yellow-600 dark:text-yellow-500">Info Keamanan:</span> {t('security_tip')}
                                </p>
                            )}
                        </form>
                    </div>
                    
                    {/* Theme & Language Toggles for Guest */}
                    <div className="flex justify-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}
                        </button>
                        <button onClick={toggleLanguage} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs flex items-center justify-center w-10 h-10">
                            {language.toUpperCase()}
                        </button>
                    </div>
                </div>
                {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg text-sm font-bold ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>{toast.message}</div>}
            </div>
        );
    }

    return (
        <div className={`flex justify-center min-h-screen bg-gray-100 dark:bg-black transition-colors duration-300 font-sans`}>
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-in slide-in-from-top-2 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {toast.message}
                </div>
            )}

            {showAddProduct && (
                <AddProductModal 
                    onClose={() => setShowAddProduct(false)} 
                    user={user} 
                    showToast={showToast} 
                    t={t} 
                    CATEGORY_KEYS={CATEGORY_KEYS} 
                />
            )}
            <ProductDetailModal viewProduct={viewProduct} setViewProduct={setViewProduct} setViewImage={setViewImage} user={user} showToast={showToast} handleAddToCart={handleAddToCart} handleStartChat={handleStartChat} t={t} />
            <ImageViewModal imageUrl={viewImage} onClose={() => setViewImage(null)} />

            <div className={`w-full max-w-md bg-gray-50 dark:bg-gray-900 min-h-screen shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-300 ${activeTab === 'chat' && chatPartner ? '' : 'pb-20'}`}>
                {/* Header based on Tab */}
                <div className="bg-white dark:bg-gray-900 p-4 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm">
                   {activeTab === 'market' && (
                       <div className="w-full">
                           <div className="flex items-center gap-2 mb-2">
                               <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                               <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400">{t('app_name')}</h1>
                           </div>
                           <div className="relative">
                               <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                           <input 
                               type="text" 
                               placeholder={t('search_placeholder')} 
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full bg-gray-100 dark:bg-gray-800 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:text-white transition" 
                           />
                       </div>
                       </div>
                   )}
                   {activeTab === 'cart' && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('cart_title')}</h1>}
                   {activeTab === 'chat' && !chatPartner && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('chat_title')}</h1>}
                   {activeTab === 'profile' && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('profile_title')}</h1>}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTab === 'chat' && (
                        <div className="h-full flex flex-col">
                            {chatPartner ? (
                                <div className="flex flex-col h-full -m-4">
                                    <div className="bg-white dark:bg-gray-900 p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setChatPartner(null)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"><ArrowLeft size={20} className="text-gray-800 dark:text-white" /></button>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400">{chatPartner[0].toUpperCase()}</div>
                                                <span className="font-bold text-gray-800 dark:text-white">{chatPartner}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteConversation(chatPartner)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"><Trash2 size={18}/></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black">
                                        {messages.filter(m => (m.sender === user.name && m.receiver === chatPartner) || (m.sender === chatPartner && m.receiver === user.name))
                                        .map((m, i) => <ChatBubble key={i} message={m} isMe={m.sender === user.name} t={t} />)}
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 sticky bottom-0 z-50">
                                        <label className="cursor-pointer text-gray-400 hover:text-teal-600 p-2"><Camera size={24} /><input type="file" className="hidden" accept="image/*" onChange={handleChatImageUpload} /></label>
                                        <input type="text" placeholder={t('chat_input_placeholder')} className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none text-gray-800 dark:text-white border border-transparent focus:border-teal-500 transition" onKeyDown={(e) => { if(e.key === 'Enter') { handleSendMessage(e.target.value); e.target.value = ''; } }} />
                                        <button onClick={(e) => { const input = e.currentTarget.previousSibling; handleSendMessage(input.value); input.value = ''; }} className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition shadow-md shadow-teal-500/30"><Send size={18} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Array.from(new Set(messages.flatMap(m => [m.sender, m.receiver]).filter(u => u !== user.name))).map(partner => (
                                        <div key={partner} onClick={() => setChatPartner(partner)} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3 cursor-pointer border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center font-bold text-teal-600 dark:text-teal-400 text-lg">{partner[0].toUpperCase()}</div>
                                            <div className="flex-1">
                                                <span className="font-bold text-gray-800 dark:text-white block">{partner}</span>
                                                <span className="text-xs text-gray-400">Tap to chat</span>
                                            </div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center mt-20 text-gray-400 gap-4">
                                            <MessageCircle size={48} className="opacity-20" />
                                            <p>{t('chat_empty')}</p>
                                            <button 
                                                onClick={() => setActiveTab('market')}
                                                className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold text-sm hover:bg-teal-700 transition shadow-lg shadow-teal-200 dark:shadow-none"
                                            >
                                                Mulai Belanja & Chat Penjual
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'market' && (
                        <div className="space-y-4">
                            {/* Category Filter */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {CATEGORY_KEYS.map(key => (
                                    <button 
                                        key={key} 
                                        onClick={() => setSelectedCategory(key)} 
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === key ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'}`}
                                    >
                                        {t(key)}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {products
                                    .filter(p => {
                                        const matchesCategory = selectedCategory === 'cat_all' || p.category === translations['id'][selectedCategory];
                                        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
                                        return matchesCategory && matchesSearch;
                                    })
                                    .length === 0 ? <p className="col-span-2 text-center text-gray-400 mt-10">{t('no_products_found')}</p> : 
                                    products
                                    .filter(p => {
                                        const matchesCategory = selectedCategory === 'cat_all' || p.category === translations['id'][selectedCategory];
                                        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
                                        return matchesCategory && matchesSearch;
                                    })
                                    .map(p => <ProductCard key={p.id} product={p} onClick={() => setViewProduct(p)} t={t} />)
                                }
                            </div>
                            <button 
                                onClick={() => setShowAddProduct(true)}
                                className="fixed bottom-24 right-4 bg-teal-600 text-white p-4 rounded-full shadow-lg shadow-teal-600/40 hover:bg-teal-700 transition-transform hover:scale-105 active:scale-95 z-30"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                    )}
                    
                    {activeTab === 'cart' && (
                        <div>
                            {cart.length === 0 ? <p className="text-center text-gray-400 mt-10">{t('cart_empty')}</p> : (
                                <div className="space-y-6">
                                    {Object.entries(cart.reduce((acc, item) => {
                                        (acc[item.seller] = acc[item.seller] || []).push(item);
                                        return acc;
                                    }, {})).map(([seller, items]) => (
                                        <div key={seller} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                                                <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400">
                                                    {seller.charAt(0).toUpperCase()}
                                                </div>
                                                <h3 className="font-bold text-gray-800 dark:text-white">{seller}</h3>
                                            </div>
                                            
                                            <div className="space-y-3 mb-4">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0">
                                                            {item.image_url && <img src={item.image_url} className="w-full h-full object-cover rounded-lg" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">{item.name}</h4>
                                                            <p className="text-teal-600 font-bold text-sm">{item.price}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-500">Jumlah: {item.quantity || 1}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setCart(prev => prev.filter(p => p !== item))} className="text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full h-fit"><Trash2 size={18} /></button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center mb-4 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                                <span className="text-gray-600 dark:text-gray-400 text-sm">Total Pesanan</span>
                                                <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                                                        items.reduce((acc, item) => {
                                                            const price = parseInt(item.price.split(',')[0].replace(/[^0-9]/g, '')) || 0;
                                                            return acc + (price * (item.quantity || 1));
                                                        }, 0)
                                                    )}
                                                </span>
                                            </div>

                                            <button 
                                                onClick={() => handleCheckoutViaChat(seller, items)}
                                                className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare size={18} /> Checkout via Chat
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm relative">
                                <div className="relative group">
                                    <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center overflow-hidden">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{user.name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-teal-600 text-white p-1 rounded-full cursor-pointer shadow-md hover:bg-teal-700 transition">
                                        <Camera size={12} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                                    </label>
                                    {uploadingAvatar && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg dark:text-white">{user.name}</h2>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                            </div>

                            {/* Statistik Pedagang */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                                        <Eye size={16} className="text-teal-600" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Total Pengunjung</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {products.filter(p => p.seller === user.name).reduce((acc, p) => acc + (p.views || 0), 0)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Total dilihat pembeli</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                                        <Package size={16} className="text-orange-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Produk Aktif</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {products.filter(p => p.seller === user.name).length}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Produk di etalase</p>
                                </div>
                            </div>
                            
                            <div onClick={toggleTheme} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer">
                                <div className="flex items-center gap-3">
                                    {theme === 'dark' ? <Moon size={18} className="text-purple-500" /> : <Sun size={18} className="text-orange-500" />}
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{theme === 'dark' ? t('dark_mode') : t('light_mode')}</span>
                                </div>
                                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-purple-500' : 'bg-gray-300'}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
                                </div>
                            </div>

                            <div onClick={toggleLanguage} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Globe size={18} className="text-teal-600" />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{language === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
                                </div>
                                <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-900 px-2 py-1 rounded-md">{language.toUpperCase()}</span>
                            </div>

                            <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 transition">{t('btn_logout')}</button>
                            <button onClick={handleDeleteAccount} className="w-full p-3 text-red-400 text-xs font-medium hover:text-red-600 transition underline">{t('btn_delete_account')}</button>
                        </div>
                    )}
                </div>

                {!(activeTab === 'chat' && chatPartner) && <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} t={t} />}
            </div>
        </div>
    );
}
