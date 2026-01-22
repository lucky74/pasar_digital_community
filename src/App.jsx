import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import MobileNav from './components/MobileNav';
import { ProductCard, ChatBubble } from './components/UIComponents';
import { LogOut, Send, Search, Bell } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('market');
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      const session = localStorage.getItem('pdc_user');
      if (session) {
        const parsedUser = JSON.parse(session);
        if (parsedUser && parsedUser.email) {
          setUser(parsedUser);
          fetchData();
          subscribeRealtime();
        } else {
           localStorage.removeItem('pdc_user');
        }
      }
    } catch (e) {
      console.error("Error parsing session:", e);
      localStorage.removeItem('pdc_user');
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
       // Jangan set false jika error lain, biarkan user tahu ada masalah
    } else {
       setDbError(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const fetchData = async () => {
    if (dbError) return;
    setLoading(true);
    const { data: dataProd } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: dataMsg } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    
    if (dataProd) setProducts(dataProd);
    if (dataMsg) setMessages(dataMsg);
    setLoading(false);
  };

  const subscribeRealtime = () => {
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
       const userData = { email, name: email.split('@')[0] };
       setUser(userData);
       localStorage.setItem('pdc_user', JSON.stringify(userData));
       fetchData();
       subscribeRealtime();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pdc_user');
    setUser(null);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = { text: chatInput, sender: user.name };
    const { error } = await supabase.from('messages').insert([newMsg]);
    
    if (error) {
       alert('Gagal kirim pesan: ' + error.message);
    } else {
       setChatInput('');
    }
  };

  const handleEditStore = () => {
    const newName = prompt("Masukkan nama toko baru:", user.name);
    if (newName && newName.trim()) {
       const updatedUser = { ...user, name: newName };
       setUser(updatedUser);
       localStorage.setItem('pdc_user', JSON.stringify(updatedUser));
       alert('Nama toko berhasil diubah!');
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
      fetchData();
      setActiveTab('market');
    } else {
      alert('Gagal: ' + error.message);
    }
    setLoading(false);
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
             Aplikasi berhasil terhubung ke Supabase, tapi tabel data belum dibuat.
           </p>
           
           <div className="bg-gray-50 p-4 rounded-xl text-left w-full border border-gray-200 mb-6">
             <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Panduan Perbaikan:</p>
             <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
               <li>Buka Dashboard Supabase.</li>
               <li>Lihat menu di sebelah kiri (Sidebar).</li>
               <li>Klik ikon <b>SQL Editor</b> (gambar kertas/terminal `&gt;_`).</li>
               <li>Klik tombol <b>New Query</b>.</li>
               <li>Paste kode SQL yang saya berikan.</li>
               <li>Klik tombol <b>RUN</b>.</li>
             </ol>
           </div>
           
           <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition">
             Saya Sudah Menjalankan SQL
           </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center bg-gray-200 min-h-screen">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
      <div className="flex flex-col items-center justify-center h-screen px-6 bg-gradient-to-b from-blue-600 to-blue-500 text-white">
        <div className="mb-8 p-4 bg-white/20 rounded-full backdrop-blur-sm">
           <Bell size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Pasar Digital</h1>
        <p className="text-blue-100 mb-10 text-sm">Komunitas Pelaku Usaha</p>
        
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full text-gray-800 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <h2 className="text-lg font-bold mb-4">Masuk Aplikasi</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
               <label className="text-xs font-semibold text-gray-500 uppercase">Alamat Email</label>
               <input name="email" type="email" required placeholder="nama@toko.com" 
                 className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>
            <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition">
              Masuk Sekarang
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-400 mt-4">Tidak butuh password & verifikasi rumit.</p>
        </div>
      </div>
      </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen">
      <div className="w-full max-w-md bg-gray-50 min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {dbError && (
          <div className="bg-red-500 text-white text-xs p-2 text-center font-bold">
            Database belum siap! Jalankan SQL di Supabase.
          </div>
        )}
        <header className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="font-bold text-lg text-blue-600 leading-none">Pasar Digital</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Halo, {user.name}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition">
            <LogOut size={16} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 p-4">
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
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                  {products.length === 0 && <p className="col-span-2 text-center text-gray-400 text-sm py-10">Belum ada produk.</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
               <div className="flex-1 overflow-y-auto pr-1">
                  {messages.map(m => (
                    <ChatBubble key={m.id} message={m} isMe={m.sender === user.name} />
                  ))}
                  <div ref={messagesEndRef} />
               </div>
               
               <div className="bg-white p-2 rounded-full shadow-lg border border-gray-100 flex gap-2 mt-2 sticky bottom-0">
                  <input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    className="flex-1 pl-4 bg-transparent outline-none text-sm" 
                    placeholder="Ketik pesan..." 
                  />
                  <button onClick={handleSendChat} className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition">
                    <Send size={18} />
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'post' && (
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
          )}
          
          {activeTab === 'profile' && (
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
          )}

        </main>

        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
