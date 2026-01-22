import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import MobileNav from './components/MobileNav';
import { ProductCard, ChatBubble, StarRating } from './components/UIComponents';
import { LogOut, Send, Search, Bell, ArrowLeft, MessageSquare, Trash2, Star } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('market');
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [cart, setCart] = useState([]); // Keranjang Belanja
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('DISCONNECTED'); // Status Realtime
  const [toast, setToast] = useState(null); // Notifikasi Toast

  // Fungsi Helper Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [chatPartner, setChatPartner] = useState(null); // Orang yang sedang dichat
  const [editData, setEditData] = useState(null);
  const [viewProduct, setViewProduct] = useState(null); // Untuk detail produk dari link
  const messagesEndRef = useRef(null);

  // DEBUGGING: Cek apakah render berjalan
  // console.log("App Render. Products:", products.length, "User:", user?.name);

  useEffect(() => {
    try {
      const session = localStorage.getItem('pdc_user');
      if (session) {
        const parsedUser = JSON.parse(session);
        if (parsedUser && parsedUser.email) {
          setUser(parsedUser);
          fetchData(parsedUser);
        } else {
           localStorage.removeItem('pdc_user');
        }
      } else {
        fetchData(null); 
      }
      // Subscribe Realtime untuk semua user (termasuk tamu)
      const unsubscribe = subscribeRealtime();
      return () => {
        unsubscribe();
      };
    } catch (e) {
      console.error("Error parsing session:", e);
      localStorage.removeItem('pdc_user');
      fetchData(null);
    }
    checkSystem();
  }, []);
      
  // --- EFFECT: Handle Deep Link (URL params) ---
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('pid');
      if (pid && products.length > 0) {
          // eslint-disable-next-line eqeqeq
          const found = products.find(p => p.id == pid);
          if (found) {
              setViewProduct(found);
              // Clean URL agar tidak muncul terus saat refresh (optional, tapi user mungkin mau bookmark)
              // window.history.replaceState({}, document.title, window.location.pathname);
          }
      }
  }, [products]);

  // --- EFFECT: Load Cart saat User Login/Berubah ---
  useEffect(() => {
      if (user && user.name) {
          const savedCart = localStorage.getItem(`pdc_cart_${user.name}`);
          if (savedCart) {
              setCart(JSON.parse(savedCart));
          } else {
              setCart([]); // Reset jika tidak ada cart tersimpan untuk user ini
          }
      } else {
          setCart([]); // Reset jika logout
      }
  }, [user]);

  // --- EFFECT: Simpan Cart ke LocalStorage (Per User) ---
  useEffect(() => {
      if (user && user.name) {
          localStorage.setItem(`pdc_cart_${user.name}`, JSON.stringify(cart));
      }
  }, [cart, user]);

  const checkSystem = async () => {
    const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
       console.error("Check System Error:", error);
       // Jika error karena tabel tidak ada ATAU Unauthorized (Key salah)
       if (error.code === '42P01' || error.message.includes('does not exist') || error.code === 'PGRST301' || error.message.includes('JWT')) {
          setDbError(true);
          alert("Koneksi Database Bermasalah! Cek Console atau pastikan URL/Key Supabase benar.");
       }
    } else {
       setDbError(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab, chatPartner]);

  const fetchData = async (currentUser = user) => {
    // if (dbError) return; // REMOVED: Don't block fetch on dbError
    setLoading(true);
    
    // 1. Ambil Produk (Publik)
    const { data: dataProd, error: prodError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    
    if (prodError) {
        console.error("Error fetching products:", prodError);
    }
    
    if (dataProd) {
        setProducts(dataProd);
    } else if (prodError) {
        // Jangan set empty jika error, biarkan data lama (jika ada)
        console.warn("Keeping old data due to fetch error");
    } else {
        // Jika sukses tapi kosong, baru set empty
        setProducts([]);
    }

    // 2. Ambil Pesan (Hanya jika login)
    // Filter: Pesan DIKIRIM OLEH saya ATAU DITERIMA OLEH saya
    if (currentUser && currentUser.name) {
       const { data: dataMsg, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq."${currentUser.name}",receiver.eq."${currentUser.name}"`)
        .order('created_at', { ascending: true });
       
       if (dataMsg) setMessages(dataMsg);
       if (error) console.error("Error fetching messages:", error);
    }

    setLoading(false);
  };

  const subscribeRealtime = () => {
    const channel = supabase.channel('public:app_changes');
    
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // Cek apakah pesan ini relevan untuk saya (sebagai penerima atau pengirim)
        // Sebenarnya filter UI akan handle, tapi kita update state global saja
        console.log("New message received:", payload.new);
        setMessages((curr) => {
             // Hindari duplikasi jika optimistic update sudah menambahkan
             if (curr.some(m => m.id === payload.new.id)) return curr;
             return [...curr, payload.new];
        });
      })
      // REALTIME PRODUK: Insert, Update, Delete
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          console.log("Product change:", payload);
          if (payload.eventType === 'INSERT') {
              setProducts(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
              setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
          } else if (payload.eventType === 'DELETE') {
              setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
      })
      .subscribe((status) => {
          console.log("Realtime Status:", status);
          setRealtimeStatus(status);
      });
      
    return () => {
        supabase.removeChannel(channel);
    };
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    if(email) {
       const name = email.split('@')[0];
       const userData = { email, name };
       setUser(userData);
       localStorage.setItem('pdc_user', JSON.stringify(userData));
       fetchData(userData);
       // subscribeRealtime(); // SUDAH DI-HANDLE DI USEEFFECT GLOBAL
       // Reset chat partner saat login baru
       setChatPartner(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pdc_user');
    setUser(null);
    setMessages([]); // Hapus pesan dari memori lokal
    setChatPartner(null);
    setActiveTab('market');
  };

  const handleStartChat = (partnerName) => {
    if (!user) {
        alert("Silakan Login dulu untuk chat penjual.");
        setActiveTab('profile');
        return;
    }
    if (partnerName === user.name) {
        alert("Ini produk Anda sendiri.");
        return;
    }
    setChatPartner(partnerName);
    setActiveTab('chat');
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatPartner) return;
    
    const newMsg = { 
        text: chatInput, 
        sender: user.name,
        receiver: chatPartner // PENTING: Set penerima
    };
    
    // Optimistic Update (Langsung tampil agar cepat)
    const tempId = Date.now();
    setMessages(prev => [...prev, { ...newMsg, id: tempId, created_at: new Date().toISOString() }]);
    setChatInput('');

    const { data, error } = await supabase.from('messages').insert([newMsg]).select();
    
    if (error) {
       alert('Gagal kirim pesan: ' + error.message);
       // Rollback jika error (opsional, tapi untuk prototype biarkan dulu)
    } else {
       // Update ID asli dari server
       setMessages(prev => prev.map(m => m.id === tempId ? data[0] : m));
    }
  };

  const handleAddToCart = (product, quantity) => {
      setCart(prev => {
          const existing = prev.find(item => item.product.id === product.id);
          if (existing) {
              return prev.map(item => 
                  item.product.id === product.id 
                  ? { ...item, quantity: item.quantity + quantity } 
                  : item
              );
          } else {
              return [...prev, { product, quantity }];
          }
      });
      alert(`Berhasil menambahkan ${quantity} ${product.name} ke keranjang.`);
  };

  const handleUpdateCartQty = (productId, newQty) => {
      if (newQty < 1) return;
      setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: newQty } : item));
  };

  const handleRemoveFromCart = (productId) => {
      if (confirm("Hapus barang ini dari keranjang?")) {
          setCart(prev => prev.filter(item => item.product.id !== productId));
      }
  };

  const handleCheckout = async () => {
      if (!user) {
          alert("Silakan Login untuk Checkout.");
          setActiveTab('profile');
          return;
      }
      
      // Group items by seller
      const ordersBySeller = {};
      cart.forEach(item => {
          const seller = item.product.seller;
          if (!ordersBySeller[seller]) ordersBySeller[seller] = [];
          ordersBySeller[seller].push(item);
      });

      // Send message to each seller
      setLoading(true);
      for (const seller of Object.keys(ordersBySeller)) {
          if (seller === user.name) continue; // Skip buying from self
          
          const items = ordersBySeller[seller];
          let messageText = `Halo kak, saya mau pesan:\n`;
          let total = 0;
          
          items.forEach(item => {
             const priceNum = parseInt(item.product.price.replace(/[^0-9]/g, '')) || 0;
             const subtotal = priceNum * item.quantity;
             total += subtotal;
             messageText += `- ${item.product.name} (${item.quantity}x) = Rp ${subtotal.toLocaleString('id-ID')}\n`;
          });
          messageText += `\nTotal: Rp ${total.toLocaleString('id-ID')}\nMohon diproses ya.`;

          const newMsg = { 
              text: messageText, 
              sender: user.name,
              receiver: seller 
          };
          
          await supabase.from('messages').insert([newMsg]);
      }
      
      setCart([]); // Clear cart
      setLoading(false);
      alert("Pesanan berhasil dikirim ke penjual via Chat!");
      setActiveTab('chat');
  };

  const handleEditStore = () => {
    const newName = prompt("Masukkan nama toko baru:", user.name);
    if (newName && newName.trim()) {
       const updatedUser = { ...user, name: newName };
       setUser(updatedUser);
       localStorage.setItem('pdc_user', JSON.stringify(updatedUser));
       alert('Nama toko berhasil diubah! Silakan relogin untuk efek penuh.');
       // Idealnya update semua produk lama juga, tapi untuk prototype ini cukup
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    setLoading(true);
    
    // Hapus dari database
    const { error } = await supabase.from('products').delete().eq('id', productId);
    
    if (error) {
        alert("Gagal hapus: " + error.message);
    } else {
        setProducts(prev => prev.filter(p => p.id !== productId));
        alert("Produk berhasil dihapus.");
    }
    setLoading(false);
  };

  const handleStartEdit = (product) => {
    setEditData(product);
    setActiveTab('post');
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const fileInput = e.target.image;
    let imageUrl = null;

    // Upload Image Logic
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];

        // Validasi Ukuran File (Maksimal 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran file terlalu besar! Maksimal 5MB agar aplikasi tetap cepat.");
            setLoading(false);
            return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('products') // Pastikan bucket 'products' ada
                .upload(filePath, file);

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                // Fallback: Jika bucket tidak ada, beri peringatan tapi tetap post produk tanpa gambar
                if (uploadError.message.includes("Bucket not found") || uploadError.statusCode === "404") {
                     alert("Peringatan: Bucket 'products' belum dibuat di Supabase Storage. Produk akan diposting tanpa gambar. Silakan buat bucket 'products' public di Dashboard Supabase.");
                } else {
                     throw uploadError;
                }
            } else {
                const { data: publicUrlData } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);
                imageUrl = publicUrlData.publicUrl;
            }
        } catch (err) {
            alert('Gagal upload gambar: ' + err.message);
            setLoading(false);
            return;
        }
    }

    const newProd = {
      name: e.target.name.value,
      price: 'Rp ' + e.target.price.value,
      description: e.target.desc.value,
      seller: user.name,
      image_url: imageUrl || (editData ? editData.image_url : null)
    };
    
    let error;
    if (editData) {
        // Mode Edit
        const { error: updateError } = await supabase
            .from('products')
            .update(newProd)
            .eq('id', editData.id);
        error = updateError;
    } else {
        // Mode Tambah Baru
        const { error: insertError } = await supabase
            .from('products')
            .insert([newProd]);
        error = insertError;
    }

    if (!error) {
      alert(editData ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditayangkan!');
      setEditData(null); // Reset edit data
      fetchData(user);
      setActiveTab('market');
    } else {
      alert('Gagal: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteConversation = async (partnerName) => {
    if (!confirm(`Hapus semua percakapan dengan ${partnerName}?`)) return;

    setLoading(true);

    // Hapus dari database (Semua pesan antara SAYA dan DIA)
    // Menggunakan filter OR yang benar untuk Supabase JS Client v2
    const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender.eq."${user.name}",receiver.eq."${partnerName}"),and(sender.eq."${partnerName}",receiver.eq."${user.name}")`);

    if (error) {
        alert("Gagal hapus chat: " + error.message);
    } else {
        // Update state lokal
        setMessages(prev => prev.filter(m => 
            !((m.sender === user.name && m.receiver === partnerName) || 
              (m.sender === partnerName && m.receiver === user.name))
        ));
        
        // Jika sedang buka chatroom ini, tutup
        if (chatPartner === partnerName) {
            setChatPartner(null);
        }
    }
    setLoading(false);
  };

  // --- LOGIC UNTUK LIST CHAT (INBOX) ---
  // Ambil semua orang yang pernah chat dengan saya
  const getInboxList = () => {
      if (!messages.length) return [];
      const interactions = new Set();
      messages.forEach(m => {
          // Jika saya pengirim, lawan bicaranya receiver
          if (m.sender === user.name && m.receiver) interactions.add(m.receiver);
          // Jika saya penerima, lawan bicaranya sender
          if (m.receiver === user.name && m.sender) interactions.add(m.sender);
          // Fallback untuk pesan lama (global) - abaikan atau tampilkan?
          // Kita abaikan pesan tanpa receiver agar rapi
      });
      return Array.from(interactions);
  };

  // Filter pesan untuk chat room saat ini
  const getCurrentChatMessages = () => {
      return messages.filter(m => 
          (m.sender === user.name && m.receiver === chatPartner) ||
          (m.sender === chatPartner && m.receiver === user.name)
      );
  };

  if (dbError) {
     // Jangan tampilkan full screen error, hanya log
     console.warn("Database status unclear, showing content anyway.");
  }

  const LoginView = () => (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="mb-6 p-4 bg-blue-50 rounded-full">
           <Bell size={32} className="text-blue-600" />
        </div>
        <h1 className="text-xl font-bold mb-1 text-gray-800">Masuk Komunitas</h1>
        <p className="text-gray-500 mb-8 text-sm">Gabung Pasar Digital untuk mulai berjualan & chat.</p>
        
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-800">
          <form onSubmit={handleLogin}>
            <div className="mb-4 text-left">
               <label className="text-xs font-semibold text-gray-500 uppercase">Alamat Email</label>
               <input name="email" type="email" required placeholder="nama@toko.com" 
                 className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>
            <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition">
              Masuk Sekarang
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-400 mt-4">Tanpa password. Langsung masuk.</p>
        </div>
      </div>
  );

  // --- MODAL DETAIL PRODUK ---
  const ProductDetailModal = () => {
      const [reviews, setReviews] = useState([]);
      const [newRating, setNewRating] = useState(0);
      const [newComment, setNewComment] = useState('');
      const [submittingReview, setSubmittingReview] = useState(false);
      const [showReviewForm, setShowReviewForm] = useState(false);

      useEffect(() => {
          if (viewProduct) {
              fetchReviews();
              
              // Realtime Reviews Subscription
              const channel = supabase
                .channel(`reviews:${viewProduct.id}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'reviews', 
                    filter: `product_id=eq.${viewProduct.id}` 
                }, () => {
                    fetchReviews();
                })
                .subscribe();

              return () => {
                  supabase.removeChannel(channel);
              };
          }
      }, [viewProduct]);

      const fetchReviews = async () => {
          const { data, error } = await supabase
              .from('reviews')
              .select('*')
              .eq('product_id', viewProduct.id)
              .order('created_at', { ascending: false });
          
          if (!error) {
              setReviews(data);
          }
      };

      const handleSubmitReview = async (e) => {
          e.preventDefault();
          if (!user) {
              showToast('Silahkan login untuk memberikan ulasan.', 'error');
              return;
          }
          if (newRating === 0) {
              showToast('Silahkan pilih bintang 1-5.', 'error');
              return;
          }

          setSubmittingReview(true);
          const { error } = await supabase.from('reviews').insert({
              product_id: viewProduct.id,
              seller: viewProduct.seller,
              reviewer: user.name, 
              rating: newRating,
              comment: newComment
          });

          if (error) {
              showToast('Gagal mengirim ulasan: ' + error.message, 'error');
          } else {
              // --- UPDATE RATING PRODUK SECARA OTOMATIS ---
              const newReviews = [...reviews, { rating: newRating }]; // Optimistic calculation
              const totalRating = newReviews.reduce((acc, curr) => acc + curr.rating, 0);
              const avgRating = totalRating / newReviews.length;
              
              await supabase.from('products').update({ 
                  rating: avgRating,
                  review_count: newReviews.length
              }).eq('id', viewProduct.id);
              // ---------------------------------------------

              showToast('Ulasan berhasil dikirim! ⭐', 'success');
              setNewRating(0);
              setNewComment('');
              setShowReviewForm(false);
              setTimeout(() => setViewProduct(null), 1500);
          }
          setSubmittingReview(false);
      };

      if (!viewProduct) return null;
      
      const avgRating = reviews.length > 0 
          ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
          : 0;

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewProduct(null)}>
              <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1">
                    <div className="relative h-64 bg-gray-100 shrink-0">
                        {viewProduct.image_url ? (
                            <img src={viewProduct.image_url} alt={viewProduct.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Search size={48} /></div>
                        )}
                        <button onClick={() => setViewProduct(null)} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                    
                    <div className="p-5">
                        <h2 className="text-xl font-bold text-gray-800 leading-tight mb-2">{viewProduct.name}</h2>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-2xl font-bold text-blue-600">{viewProduct.price}</p>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-gray-700">{avgRating > 0 ? avgRating : '-'}</span>
                                <span className="text-xs text-gray-400">({reviews.length} ulasan)</span>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-xl mb-6 text-sm text-gray-600">
                            <p className="font-semibold mb-1 text-gray-800">Deskripsi:</p>
                            <p className="whitespace-pre-wrap">{viewProduct.description || "Tidak ada deskripsi."}</p>
                        </div>

                        {/* Seller Info */}
                        <div className="flex items-center gap-3 mb-6 p-3 border border-gray-100 rounded-xl">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                {viewProduct.seller.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Penjual</p>
                                <p className="font-bold text-gray-800">{viewProduct.seller}</p>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-800">Ulasan & Rating</h3>
                                <button 
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                    {showReviewForm ? 'Batal' : '+ Tulis Ulasan'}
                                </button>
                            </div>

                            {showReviewForm && (
                                <form onSubmit={handleSubmitReview} className="bg-blue-50 p-3 rounded-xl mb-4 animate-in slide-in-from-top-2">
                                    <div className="mb-2 flex justify-center">
                                        <StarRating rating={newRating} setRating={setNewRating} size={24} />
                                    </div>
                                    <textarea 
                                        placeholder="Tulis pengalamanmu..." 
                                        className="w-full p-2 rounded-lg text-sm border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                        rows={2}
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={submittingReview}
                                        className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                                    </button>
                                </form>
                            )}

                            <div className="space-y-3">
                                {reviews.length === 0 ? (
                                    <p className="text-center text-gray-400 text-xs py-2">Belum ada ulasan.</p>
                                ) : (
                                    reviews.map((rev) => (
                                        <div key={rev.id} className="border-b border-gray-100 pb-2 last:border-0">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-xs text-gray-800">{rev.reviewer}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex my-0.5">
                                                <StarRating rating={rev.rating} readOnly size={10} />
                                            </div>
                                            <p className="text-xs text-gray-600 leading-snug">{rev.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Fixed Bottom Action */}
                  <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                      <div className="flex gap-2">
                          <button 
                              onClick={() => { handleAddToCart(viewProduct, 1); setViewProduct(null); }}
                              className="flex-1 bg-orange-100 text-orange-600 py-3 rounded-xl font-bold hover:bg-orange-200 transition"
                          >
                              + Keranjang
                          </button>
                          <button 
                              onClick={() => { handleStartChat(viewProduct.seller); setViewProduct(null); }}
                              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                          >
                              Chat Penjual
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-in slide-in-from-top-2 fade-in duration-300 ${
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
            {toast.message}
        </div>
      )}
      <ProductDetailModal />
      <div className="w-full max-w-md bg-gray-50 min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {dbError && (
          <div className="bg-red-500 text-white text-xs p-2 text-center font-bold">
            Database Error! Cek SQL.
          </div>
        )}
        
        {/* HEADER */}
        <header className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="font-bold text-lg text-blue-600 leading-none flex items-center gap-2">
                Pasar Digital
                <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-red-500'}`} title={`Status Realtime: ${realtimeStatus}`}></span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
               {user ? `Halo, ${user.name}` : 'Selamat Datang, Tamu'}
            </p>
          </div>
          {user ? (
            <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition">
              <LogOut size={16} />
            </button>
          ) : (
            <button onClick={() => setActiveTab('profile')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
               Login
            </button>
          )}
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 p-4">
          
          {/* TAB: MARKET (PRODUK) */}
          {activeTab === 'market' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <input type="text" placeholder="Mau cari barang apa?" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-none shadow-sm text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
              
              {loading ? (
                 <div className="flex justify-center py-10"><div className="loader"></div></div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {products.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onChat={handleStartChat} 
                      onAddToCart={handleAddToCart} 
                      onDelete={handleDeleteProduct}
                      onEdit={handleStartEdit}
                      isOwner={user && user.name === p.seller}
                      onClick={setViewProduct}
                    />
                  ))}
                  {products.length === 0 && <p className="col-span-2 text-center text-gray-400 text-sm py-10">Belum ada produk.</p>}
                </div>
              )}
            </div>
          )}

          {/* TAB: CART (KERANJANG) */}
          {activeTab === 'cart' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                  <h2 className="font-bold text-lg text-gray-800">Keranjang Belanja</h2>
                  {cart.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                          <p>Keranjang masih kosong.</p>
                      </div>
                  ) : (
                      <div className="space-y-3 pb-20">
                          {cart.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl shadow-sm flex gap-3">
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                     {item.product.image_url ? (
                                        <img src={item.product.image_url} alt="" className="w-full h-full object-cover"/>
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Img</div>
                                     )}
                                  </div>
                                  <div className="flex-1">
                                      <h3 className="font-semibold text-sm line-clamp-1">{item.product.name}</h3>
                                      <p className="text-xs text-gray-500 mb-2">Penjual: {item.product.seller}</p>
                                      <div className="flex justify-between items-center">
                                          <p className="text-blue-600 font-bold text-sm">{item.product.price}</p>
                                          
                                          <div className="flex items-center gap-2">
                                              <button onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)} className="w-6 h-6 bg-gray-100 rounded text-gray-600 font-bold">-</button>
                                              <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                                              <button onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)} className="w-6 h-6 bg-gray-100 rounded text-gray-600 font-bold">+</button>
                                              <button onClick={() => handleRemoveFromCart(item.product.id)} className="ml-2 text-red-500 text-xs">Hapus</button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          
                          <div className="fixed bottom-20 left-0 right-0 px-4">
                              <button onClick={handleCheckout} className="w-full max-w-md mx-auto bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition">
                                  Checkout via Chat
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* TAB: CHAT (PESAN) */}
          {activeTab === 'chat' && (
            !user ? <LoginView /> : (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    
                    {/* MODE 1: DAFTAR CHAT (INBOX) - Jika belum pilih teman chat */}
                    {!chatPartner && (
                        <div className="space-y-2">
                            <h2 className="font-bold text-lg mb-4 text-gray-800">Pesan Masuk</h2>
                            {getInboxList().length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Belum ada pesan.</p>
                                    <p className="text-xs">Cari produk dan klik "Chat" untuk memulai.</p>
                                </div>
                            ) : (
                                getInboxList().map(name => (
                                    <div key={name} className="flex gap-2 items-center">
                                        <div onClick={() => setChatPartner(name)} className="flex-1 bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-800">{name}</h3>
                                                <p className="text-xs text-gray-400">Klik untuk melihat pesan</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteConversation(name)} className="bg-red-50 text-red-500 p-4 rounded-xl shadow-sm hover:bg-red-100 transition">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* MODE 2: CHAT ROOM - Jika sedang chat dengan seseorang */}
                    {chatPartner && (
                        <div className="flex flex-col h-full">
                            {/* Chat Header */}
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                                <button onClick={() => setChatPartner(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <ArrowLeft size={20} className="text-gray-600" />
                                </button>
                                <div className="font-bold text-gray-800 flex-1">{chatPartner}</div>
                                <button onClick={() => handleDeleteConversation(chatPartner)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto pr-1">
                                {getCurrentChatMessages().length === 0 && (
                                    <p className="text-center text-xs text-gray-400 py-4">Mulai percakapan dengan {chatPartner}...</p>
                                )}
                                {getCurrentChatMessages().map(m => (
                                    <ChatBubble key={m.id} message={m} isMe={m.sender === user.name} />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            
                            {/* Chat Input */}
                            <div className="bg-white p-2 rounded-full shadow-lg border border-gray-100 flex gap-2 mt-2 sticky bottom-0">
                                <input 
                                    value={chatInput} 
                                    onChange={e => setChatInput(e.target.value)} 
                                    className="flex-1 pl-4 bg-transparent outline-none text-sm" 
                                    placeholder={`Kirim pesan ke ${chatPartner}...`} 
                                />
                                <button onClick={handleSendChat} className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )
          )}

          {/* TAB: JUAL (FORM POST) */}
          {activeTab === 'post' && (
            !user ? <LoginView /> : (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg text-gray-800">{editData ? 'Edit Produk' : 'Jual Barang'}</h2>
                  {editData && (
                      <button onClick={() => setEditData(null)} className="text-xs text-red-500 underline">Batal Edit</button>
                  )}
              </div>
              
              <form onSubmit={handlePost} className="space-y-4" key={editData ? editData.id : 'new'}>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Nama Produk</label>
                  <input type="text" name="name" defaultValue={editData?.name || ''} placeholder="Contoh: Kripik Pisang" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Harga (Rp)</label>
                  <input type="number" name="price" defaultValue={editData ? editData.price.replace(/[^0-9]/g, '') : ''} placeholder="Contoh: 15000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Deskripsi</label>
                  <textarea name="desc" defaultValue={editData?.description || ''} placeholder="Jelaskan produkmu..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium h-24 resize-none" required></textarea>
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Foto Produk {editData && '(Biarkan kosong jika tidak ganti)'}</label>
                   <div className="relative">
                       <input type="file" name="image" accept="image/*" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                   </div>
                   {editData && editData.image_url && (
                       <div className="mt-2">
                           <p className="text-[10px] text-gray-400 mb-1">Foto saat ini:</p>
                           <img src={editData.image_url} alt="Current" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                       </div>
                   )}
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                  {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                      </>
                  ) : (
                      editData ? 'Simpan Perubahan' : 'Tayangkan Sekarang'
                  )}
                </button>
              </form>
            </div>
            )
          )}
          
          {/* TAB: PROFIL (AKUN) */}
          {activeTab === 'profile' && (
             !user ? <LoginView /> : (
             <div className="pt-8 flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-24 h-24 bg-gradient-to-tr from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                   {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-sm text-gray-500 mb-8">{user.email}</p>
                
                <div className="w-full space-y-3">
                   <div onClick={handleEditStore} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition">
                      <span className="text-sm font-medium">Pengaturan Toko (Ubah Nama)</span>
                      <span className="text-gray-300">→</span>
                   </div>
                   <div onClick={() => alert('Hubungi: lucky.jamaludin@gmail.com')} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition">
                      <span className="text-sm font-medium">Bantuan</span>
                      <span className="text-gray-300">→</span>
                   </div>
                   <button onClick={handleLogout} className="w-full bg-red-50 p-4 rounded-xl text-red-600 text-sm font-bold mt-4">
                      Keluar Aplikasi
                   </button>
                </div>
             </div>
             )
          )}

        </main>

        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
