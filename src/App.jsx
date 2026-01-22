import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import MobileNav from './components/MobileNav';
import { ProductCard, ChatBubble } from './components/UIComponents';
import { LogOut, Send, Search, Bell, ArrowLeft, MessageSquare } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('market');
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [chatPartner, setChatPartner] = useState(null); // Orang yang sedang dichat
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      const session = localStorage.getItem('pdc_user');
      if (session) {
        const parsedUser = JSON.parse(session);
        if (parsedUser && parsedUser.email) {
          setUser(parsedUser);
          // Kita panggil fetchData nanti di useEffect terpisah atau di sini
          // Tapi karena user state asinkron, lebih aman panggil dengan data langsung
          fetchData(parsedUser);
          subscribeRealtime();
        } else {
           localStorage.removeItem('pdc_user');
        }
      } else {
        fetchData(null); // Fetch public data even if not logged in
      }
    } catch (e) {
      console.error("Error parsing session:", e);
      localStorage.removeItem('pdc_user');
      fetchData(null);
    }
    checkSystem();
  }, []);

  const checkSystem = async () => {
    const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
       console.error("Check System Error:", error);
       if (error.code === '42P01' || error.message.includes('does not exist')) {
          setDbError(true);
       }
    } else {
       setDbError(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab, chatPartner]);

  const fetchData = async (currentUser = user) => {
    if (dbError) return;
    setLoading(true);
    
    // 1. Ambil Produk (Publik)
    const { data: dataProd } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (dataProd) setProducts(dataProd);

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
    // Kita subscribe ke semua pesan, tapi nanti difilter di UI atau Fetch ulang
    // Idealnya filter di sini juga, tapi Supabase Realtime filter agak terbatas untuk .or
    // Jadi kita terima semua, lalu cek apakah relevan dengan kita
    supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((curr) => [...curr, payload.new]);
      })
      .subscribe();
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
       subscribeRealtime();
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

  const handlePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newProd = {
      name: e.target.name.value,
      price: 'Rp ' + e.target.price.value,
      description: e.target.desc.value,
      seller: user.name
    };
    
    const { error } = await supabase.from('products').insert([newProd]);
    if (!error) {
      alert('Produk berhasil ditayangkan!');
      fetchData(user);
      setActiveTab('market');
    } else {
      alert('Gagal: ' + error.message);
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
    return (
      <div className="flex justify-center bg-gray-200 min-h-screen">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col items-center justify-center p-6 text-center">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">⚠️</span>
           </div>
           <h2 className="text-xl font-bold text-gray-800 mb-2">Database Belum Siap</h2>
           <p className="text-sm text-gray-500 mb-6">
             Aplikasi berhasil terhubung, tapi tabel data perlu diupdate.
           </p>
           <div className="bg-gray-50 p-4 rounded-xl text-left w-full border border-gray-200 mb-6">
             <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Update Diperlukan:</p>
             <p className="text-sm text-gray-700">Silakan jalankan SQL update yang baru saya buat.</p>
           </div>
           <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition">
             Saya Sudah Update SQL
           </button>
        </div>
      </div>
    );
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

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen">
      <div className="w-full max-w-md bg-gray-50 min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {dbError && (
          <div className="bg-red-500 text-white text-xs p-2 text-center font-bold">
            Database Error! Cek SQL.
          </div>
        )}
        
        {/* HEADER */}
        <header className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="font-bold text-lg text-blue-600 leading-none">Pasar Digital</h1>
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
                    <ProductCard key={p.id} product={p} onChat={handleStartChat} />
                  ))}
                  {products.length === 0 && <p className="col-span-2 text-center text-gray-400 text-sm py-10">Belum ada produk.</p>}
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
                                    <div key={name} onClick={() => setChatPartner(name)} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800">{name}</h3>
                                            <p className="text-xs text-gray-400">Klik untuk melihat pesan</p>
                                        </div>
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
                                <div className="font-bold text-gray-800">{chatPartner}</div>
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

          {/* TAB: JUAL (POST) */}
          {activeTab === 'post' && (
            !user ? <LoginView /> : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in zoom-in-95 duration-200">
              <h2 className="font-bold text-lg mb-6 text-center text-gray-800">Mulai Berjualan</h2>
              <form className="space-y-4" onSubmit={handlePost}>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Barang</label>
                  <input name="name" required className="w-full p-3 bg-gray-50 rounded-xl text-sm border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" placeholder="Contoh: Madu Hutan" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Harga (Rupiah)</label>
                  <input name="price" type="number" required className="w-full p-3 bg-gray-50 rounded-xl text-sm border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" placeholder="Contoh: 50000" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Keterangan</label>
                  <textarea name="desc" className="w-full p-3 bg-gray-50 rounded-xl text-sm border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition h-24" placeholder="Jelaskan kondisi barang..."></textarea>
                </div>
                <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-none translate-y-0 hover:translate-y-1 transition-all">
                  {loading ? 'Sedang Memproses...' : 'Tayangkan Sekarang'}
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
