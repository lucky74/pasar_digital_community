import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { supabase } from './lib/supabaseClient';
import { translations } from './translations';
import MobileNav from './components/MobileNav';
import WishlistView from './components/WishlistView';
import { ProductCard, ChatBubble, StarRating, DateSeparator } from './components/UIComponents';
import { LogOut, Send, Search, Bell, ArrowLeft, MessageSquare, Trash2, Star, Camera, X, Eye, EyeOff, MessageCircle, BarChart3, Package, Users, Moon, Sun, Globe, Filter, Plus, Minus, Upload, ShoppingCart, Share2, HelpCircle, Info, Lock, ShoppingBag, DollarSign, MapPin, Edit2 } from 'lucide-react';

// --- UTILS ---
const chatBgStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23888888' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E")`,
};

const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Smart Compression: 1280px is HD enough but much lighter for upload
                const MAX_WIDTH = 1280; 
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round(height * (MAX_WIDTH / width));
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, 'image/jpeg', 0.8); // 80% quality (Good balance)
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

// --- MODAL GANTI PASSWORD ---
const ChangePasswordModal = ({ onClose, showToast, t }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            showToast(t('password_min_length'), 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast(t('password_mismatch'), 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            
            if (error) throw error;

            showToast(t('password_updated'), 'success');
            setTimeout(() => {
                onClose();
                window.location.reload(); // Force logout/reload to ensure security state
            }, 1500);

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Lock className="text-teal-600" /> {t('change_password_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="relative">
                        <input 
                            type={showPass ? "text" : "password"} 
                            placeholder={t('new_password')} 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition dark:text-white border border-gray-200 dark:border-gray-700"
                            required
                        />
                         <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    
                    <input 
                        type="password" 
                        placeholder={t('confirm_password')} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition dark:text-white border border-gray-200 dark:border-gray-700"
                        required
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('processing') : t('update_password_btn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- MODAL EDIT PROFILE ---
const EditProfileModal = ({ onClose, user, showToast, t, setUser }) => {
    const [username, setUsername] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!username.trim()) return;
        if (username === user.name) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            // 1. Check if username exists
            const { data: existing, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (existing) {
                showToast(t('username_taken'), 'error');
                setLoading(false);
                return;
            }

            // 2. Update Profile (Upsert to ensure existence)
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({ 
                    id: user.id,
                    username: username,
                    updated_at: new Date()
                }, { onConflict: 'id' });

            if (updateError) throw updateError;

            // 3. Update Local State
            // Note: This does NOT update historical data in other tables (products, messages) automatically
            // unless there is a database trigger.
            // Warn user about this? Or try to update best effort?
            // For now, we update local state so UI reflects change.
            setUser({ ...user, name: username });
            
            showToast(t('username_success'), 'success');
            showToast(t('warning_username_change'), 'info');
            
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            console.error("Update Profile Error:", error);
            showToast(t('username_fail') + " " + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Edit2 className="text-teal-600" /> {t('edit_profile_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('username_label')}</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition dark:text-white border border-gray-200 dark:border-gray-700"
                            required
                        />
                        <p className="text-xs text-yellow-600 mt-1 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                            Warning: Updating username may not update old messages/products immediately.
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-50"
                    >
                        {loading ? t('processing') : t('update_btn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

const MembersModal = ({ onClose, members, onKick, currentGroup, currentUser, t }) => {
    const isOwner = currentGroup?.created_by === currentUser?.name;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Users className="text-teal-600" /> {t('member_count')} ({members.length})
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id || member.user_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center font-bold text-teal-600 dark:text-teal-400 overflow-hidden">
                                     {member.profiles?.avatar_url ? (
                                         <img src={member.profiles.avatar_url} alt={member.profiles.username} className="w-full h-full object-cover" />
                                     ) : (
                                         <span>{member.profiles?.username?.[0]?.toUpperCase() || '?'}</span>
                                     )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">
                                        {member.profiles?.username || 'Unknown'}
                                        {member.profiles?.username === currentGroup.created_by && (
                                            <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">
                                                {t('group_admin')}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            {isOwner && member.profiles?.username !== currentUser.name && (
                                <button 
                                    onClick={() => onKick(member.user_id, currentGroup.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                    title={t('kick_member')}
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {members.length === 0 && (
                        <p className="text-center text-gray-400 py-4">Belum ada anggota lain.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const CreateGroupModal = ({ onClose, showToast, t, user }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user) return showToast(t('alert_login_group'), 'error');

        setLoading(true);
        try {
            const { data: newGroup, error } = await supabase.from('groups').insert({
                name,
                description,
                created_by: user.name, // Using name for simplicity as per current app structure
                image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            }).select().single();

            if (error) throw error;

            // Add creator as admin
            if (newGroup) {
                await supabase.from('group_members').insert({
                    group_id: newGroup.id,
                    user_id: user.id,
                    role: 'admin'
                });
            }

            showToast(t('group_created'), 'success');
            onClose();
        } catch (error) {
            showToast(t('group_create_fail') + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Users className="text-teal-600" /> {t('create_group')}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder={t('group_name_placeholder')} 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition dark:text-white border border-gray-200 dark:border-gray-700"
                        required
                    />
                    
                    <textarea 
                        placeholder={t('group_desc_placeholder')} 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition dark:text-white border border-gray-200 dark:border-gray-700 h-24 resize-none"
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-50"
                    >
                        {loading ? t('processing') : t('create_group_btn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- STATUS COMPONENTS ---
const StatusList = ({ statuses, user, onAdd, onViewUser, t }) => {
    const grouped = statuses.reduce((acc, status) => {
        const uid = status.user_id;
        if (!acc[uid]) acc[uid] = { user: status.profiles, statuses: [] };
        acc[uid].statuses.push(status);
        return acc;
    }, {});

    const hasMyStatus = user && grouped[user.id];
    
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide">
            {/* Add Status Button */}
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={onAdd}>
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-teal-400 p-1 relative">
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                        {user?.avatar_url ? (
                             <img src={user.avatar_url} className="w-full h-full object-cover opacity-80" />
                        ) : (
                             <Camera size={20} className="text-teal-600" />
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-teal-600 text-white rounded-full p-1 border-2 border-white dark:border-gray-900">
                        <Plus size={12} />
                    </div>
                </div>
                <span className="text-xs font-medium dark:text-white truncate w-16 text-center">{t('add_status')}</span>
            </div>

            {/* My Status (if exists) */}
            {hasMyStatus && (
                <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => onViewUser(user.id)}>
                   <div className="w-16 h-16 rounded-full border-2 border-teal-500 p-0.5">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                            <img src={user.avatar_url} className="w-full h-full object-cover" />
                        </div>
                   </div>
                   <span className="text-xs font-medium dark:text-white truncate w-16 text-center">{t('sender_you')}</span>
                </div>
            )}

            {/* Other Statuses */}
            {Object.entries(grouped).map(([uid, data]) => {
                if (uid === user?.id) return null; 
                return (
                    <div key={uid} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => onViewUser(uid)}>
                        <div className="w-16 h-16 rounded-full border-2 border-teal-500 p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                                {data.user?.avatar_url ? (
                                    <img src={data.user.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-teal-100 text-teal-600 font-bold">
                                        {data.user?.username?.[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-medium dark:text-white truncate w-16 text-center">{data.user?.username}</span>
                    </div>
                );
            })}
        </div>
    );
};

const CreateStatusModal = ({ onClose, user, showToast, t, onSuccess }) => {
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showToast(t('alert_file_size_5mb'), 'error');
            return;
        }

        try {
            const compressed = await compressImage(file);
            setImage(compressed);
            setPreview(URL.createObjectURL(compressed));
        } catch (err) {
            console.error(err);
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image && !caption) return;
        setLoading(true);

        try {
            let publicUrl = null;
            if (image) {
                const fileName = `${user.id}_${Date.now()}_status.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('status_media')
                    .upload(fileName, image);
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('status_media').getPublicUrl(fileName);
                publicUrl = data.publicUrl;
            }

            const { error: insertError } = await supabase.from('statuses').insert({
                user_id: user.id,
                media_url: publicUrl,
                caption: caption,
                expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
            });

            if (insertError) throw insertError;

            showToast(t('status_uploaded'), 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Status Upload Error:", error);
            showToast(t('alert_upload_fail') + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Camera className="text-teal-600" /> {t('add_status')}
                    </h2>
                    <button onClick={onClose}><X className="dark:text-white" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center relative border-2 border-dashed border-gray-300 dark:border-gray-700">
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <Camera size={48} className="mx-auto mb-2" />
                                <p>Upload Foto/Video</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <textarea 
                        value={caption} 
                        onChange={e => setCaption(e.target.value)} 
                        placeholder={t('status_caption_placeholder')}
                        className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded-xl outline-none dark:text-white border border-gray-200 dark:border-gray-700"
                        rows={3}
                    />
                    <button disabled={loading} type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-50">
                        {loading ? t('processing') : t('add_status')}
                    </button>
                </form>
            </div>
        </div>
    );
};

const StatusViewerModal = ({ onClose, statuses, user, onDelete, t }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const status = statuses[currentIndex];

    // Safety check if status is deleted while viewing
    useEffect(() => {
        if (!status && statuses.length === 0) {
            onClose();
        } else if (!status && statuses.length > 0) {
             // If current index is out of bounds, reset to 0 or last
             setCurrentIndex(0);
        }
    }, [status, statuses, onClose]);

    if (!status) return null;

    const isOwner = user?.id === status.user_id;

    const handleNext = (e) => {
        e.stopPropagation();
        if (currentIndex < statuses.length - 1) setCurrentIndex(prev => prev + 1);
        else onClose();
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    if (!status) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full max-w-md h-full md:h-[90vh] bg-black md:rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Progress Bar */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {statuses.map((_, idx) => (
                        <div key={idx} className={`h-1 flex-1 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                            {status.profiles?.avatar_url ? (
                                <img src={status.profiles.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-teal-500 flex items-center justify-center text-xs text-white font-bold">
                                    {status.profiles?.username?.[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                             <span className="text-white font-bold text-sm shadow-black drop-shadow-md leading-none">{status.profiles?.username}</span>
                             <span className="text-white/80 text-[10px] shadow-black drop-shadow-md">{new Date(status.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         {isOwner && (
                            <button onClick={() => onDelete(status.id)} className="p-2 bg-black/20 rounded-full text-white/80 hover:bg-red-500/50 transition">
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white hover:bg-white/20 transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
                    {status.media_url ? (
                        <img src={status.media_url} className="max-w-full max-h-full object-contain" />
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-white text-xl font-serif italic">"{status.caption}"</p>
                        </div>
                    )}
                    
                    {/* Caption Overlay */}
                    {status.media_url && status.caption && (
                        <div className="absolute bottom-20 left-0 right-0 p-4 text-center">
                            <p className="inline-block bg-black/50 text-white px-4 py-2 rounded-xl backdrop-blur-sm text-sm">
                                {status.caption}
                            </p>
                        </div>
                    )}

                    {/* Navigation Areas */}
                    <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
                    <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext} />
                </div>
            </div>
        </div>
    );
};

// --- MODAL TENTANG ---
const AboutModal = ({ onClose, t }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Info className="text-teal-600" /> {t('about_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="space-y-6 text-gray-700 dark:text-gray-300">
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30">
                        <p className="font-bold text-teal-800 dark:text-teal-400 text-sm italic">"{t('about_vision')}"</p>
                    </div>

                    <p className="leading-relaxed text-sm">
                        {t('about_desc_1')}
                    </p>
                    <p className="leading-relaxed text-sm">
                        {t('about_desc_2')}
                    </p>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <p className="text-xs text-gray-500 italic text-center">
                            {t('about_founder')}
                        </p>
                    </div>

                    <button onClick={onClose} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL BANTUAN ---
const HelpModal = ({ onClose, t }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <HelpCircle className="text-teal-600" /> {t('help_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Android Guide */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                        <h3 className="font-bold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                            📱 {t('install_android_title')}
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li>{t('install_android_step1')}</li>
                            <li>{t('install_android_step2')}</li>
                            <li>{t('install_android_step3')}</li>
                            <li>{t('install_android_step4')}</li>
                            <li>{t('install_android_step5')}</li>
                        </ol>
                    </div>

                    {/* iOS Guide */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                            🍎 {t('install_ios_title')}
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li>{t('install_ios_step1')}</li>
                            <li>{t('install_ios_step2')}</li>
                            <li>{t('install_ios_step3')}</li>
                            <li>{t('install_ios_step4')}</li>
                            <li>{t('install_ios_step5')}</li>
                        </ol>
                    </div>

                    <button onClick={onClose} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

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
                // Compress image before upload
                let fileToUpload = image;
                
                // SMART COMPRESSION: Only if > 1MB
                if (image.size > 1024 * 1024) { 
                    try {
                        fileToUpload = await compressImage(image);
                    } catch (compError) {
                        console.warn("Compression failed, using original:", compError);
                    }
                }

                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;
                
                // Upload with Retry Logic (3 attempts)
                let uploadError = null;
                for (let i = 0; i < 3; i++) {
                    const { error } = await supabase.storage.from('products').upload(filePath, fileToUpload, {
                        cacheControl: '3600',
                        upsert: false
                    });
                    uploadError = error;
                    if (!uploadError) break; // Success!
                    await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s before retry
                }
                
                if (uploadError) {
                    console.error("Supabase Upload Error:", uploadError);
                    if (uploadError.message.includes("Bucket not found")) {
                        throw new Error(t('alert_bucket_products_missing'));
                    }
                    if (uploadError.message.includes("is aborted")) {
                        throw new Error("Koneksi tidak stabil. Mohon cek sinyal internet Anda dan coba lagi.");
                    }
                    if (uploadError.message.includes("Payload Too Large") || uploadError.statusCode === 413) {
                         throw new Error("Ukuran file terlalu besar untuk server. Coba kurangi sedikit.");
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
    // Fix: Case-insensitive check for ownership
    const isSeller = user?.name?.toLowerCase() === viewProduct?.seller?.toLowerCase();

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

    const handleShareProduct = async () => {
        const shareData = {
            title: viewProduct.name,
            text: `${_t('share_text')} ${viewProduct.name} - ${viewProduct.price}\n\nDownload Aplikasi: ${window.location.origin}`,
        };

        try {
            if (navigator.share) {
                // Try to share with image
                if (viewProduct.image_url) {
                    try {
                        const response = await fetch(viewProduct.image_url);
                        const blob = await response.blob();
                        const file = new File([blob], "product.jpg", { type: blob.type });
                        
                        await navigator.share({
                            ...shareData,
                            files: [file]
                        });
                        return; // Success
                    } catch (imageError) {
                        console.warn('Image share failed, falling back to text:', imageError);
                        // Continue to text-only share
                    }
                }

                // Text-only share
                await navigator.share({
                    ...shareData,
                    url: window.location.origin // Use origin as the app link since we don't have routing
                });
            } else {
                throw new Error("Web Share API not supported");
            }
        } catch (err) {
            console.log('Error sharing:', err);
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(`${shareData.text}\n${window.location.origin}`)
                .then(() => showToast(_t('share_success'), 'success'))
                .catch(() => showToast(_t('share_fail'), 'error'));
        }
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
                        <button onClick={handleShareProduct} className="absolute top-2 right-14 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"><Share2 size={20} /></button>
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
                                {/* Robust display for sold_count */}
                                <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-1 rounded">
                                    {viewProduct.sold_count !== undefined && viewProduct.sold_count !== null ? viewProduct.sold_count : 0} {_t('sold_count')}
                                </span>
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
  "cat_baby", "cat_toys", "cat_education", "cat_electronic", "cat_automotive", 
  "cat_property", "cat_service", "cat_kids_fashion", "cat_shoes", "cat_sandals",
  "cat_bags", "cat_wallets", "cat_school", "cat_accessories", "cat_spareparts",
  "cat_swim", "cat_sports", "cat_office", "cat_music", "cat_others"
];

const LocationPickerModal = React.lazy(() => import('./components/LocationPickerModal'));

export default function App() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW Registration Error:', error);
        },
    });

    // Removed duplicate user state declaration
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]); // Array of product IDs
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('market');
    const [viewProduct, setViewProduct] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [chatPartner, setChatPartner] = useState(null);
    const [viewImage, setViewImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('cat_all');
    const [sortBy, setSortBy] = useState('latest');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'id');
    const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
    
    // Group Chat State
    const [groups, setGroups] = useState([]);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupMessages, setGroupMessages] = useState([]);
    const [memberCounts, setMemberCounts] = useState({});
    const [myJoinedGroups, setMyJoinedGroups] = useState(new Set());
    const [myGroupRoles, setMyGroupRoles] = useState({});
    const [groupMembersList, setGroupMembersList] = useState([]);
    const [showMembersModal, setShowMembersModal] = useState(false);
    
    // Status State
    const [statuses, setStatuses] = useState([]);
    const [showCreateStatus, setShowCreateStatus] = useState(false);
    const [viewStatusUserId, setViewStatusUserId] = useState(null);
    
    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const t = (key) => translations[language][key] || key;

    // OPTIMIZED: Initialize User from LocalStorage for instant load (Stale-While-Revalidate)
    const [user, setUser] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_user_profile');
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    });

    // If we have a cached user, we don't need to block rendering
    const [isAuthChecking, setIsAuthChecking] = useState(() => !localStorage.getItem('cached_user_profile'));

    // Cache User Profile Effect
    useEffect(() => {
        if (user) {
            localStorage.setItem('cached_user_profile', JSON.stringify(user));
        } else {
            // Only remove if we are sure we want to logout (handled in handleLogout)
            // But here we sync state to storage
            // localStorage.removeItem('cached_user_profile'); 
            // We'll let handleLogout clear it explicitly to avoid accidental clears during race conditions
        }
    }, [user]);

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

    // Check Auth with robust session handling
    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async (sessionUser) => {
            if (!sessionUser) return null;
            try {
                console.log("Fetching profile for:", sessionUser.id);
                // Timeout for profile fetch as well
                const profilePromise = supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Profile fetch timeout")), 2000));
                
                const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]);

                if (error) {
                    console.warn("Profile fetch warning:", error);
                }
                if (profile) console.log("Profile found:", profile.username);
                return profile 
                    ? { ...sessionUser, name: profile.username, avatar_url: profile.avatar_url } 
                    : { ...sessionUser, name: sessionUser.email?.split('@')[0] || 'User' }; 
            } catch (err) {
                console.error("Profile fetch error:", err);
                // SAFE FALLBACK: Ensure 'name' property exists to prevent crash
                return { 
                    ...sessionUser, 
                    name: sessionUser.user_metadata?.username || sessionUser.email?.split('@')[0] || 'User',
                    avatar_url: null 
                };
            }
        };

        const initSession = async () => {
            // 1. FAST PATH: Try to restore from Local Cache IMMEDIATELY
            const cachedProfile = localStorage.getItem('cached_user_profile');
            let hasCache = false;

            if (cachedProfile) {
                try {
                    const parsed = JSON.parse(cachedProfile);
                    if (parsed && isMounted) {
                        console.log("Restoring session from cache (Instant Load)");
                        setUser(parsed);
                        // IMPORTANT: Unblock UI immediately if we have cache
                        setIsAuthChecking(false); 
                        hasCache = true;
                    }
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }

            try {
                // 2. BACKGROUND VALIDATION: Check with server
                // We don't await this if we already rendered cache, or we handle it gracefully
                console.log("Validating session with server...");
                
                // Safety timeout: 2 seconds max for initial auth check
                const timeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Auth check timeout")), 2000)
                );

                const { data: { session }, error } = await Promise.race([
                    supabase.auth.getSession(),
                    timeout
                ]);

                if (error) throw error;

                if (isMounted && session?.user) {
                    console.log("Server session valid:", session.user.email);
                    const userWithProfile = await fetchProfile(session.user);
                    if (isMounted) {
                        setUser(userWithProfile); // Update with fresh data
                        // Update cache
                        localStorage.setItem('cached_user_profile', JSON.stringify(userWithProfile));
                    }
                } else {
                    console.log("No active server session found.");
                    if (isMounted && !hasCache) {
                        // Only clear if we didn't have cache (or maybe we should clear cache if server says invalid?)
                        // For better UX on "offline/flaky", we keep cache unless explicitly signed out.
                        // But if server explicitly says "no session", we might want to prompt login?
                        // For now, let's trust the cache for "read-only" feel, but user actions will fail if token dead.
                    }
                }
            } catch (err) {
                console.warn("Session validation skipped/failed:", err);
            } finally {
                if (isMounted) setIsAuthChecking(false);
            }
        };

        // 1. Run check
        initSession();


        // 2. Listen for auth changes (login, logout, refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event);
            if (isMounted) {
                if (session?.user) {
                     // On INITIAL_SESSION or SIGNED_IN, we force update
                     if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        const userWithProfile = await fetchProfile(session.user);
                        if (isMounted) setUser(userWithProfile);
                     }
                } else if (event === 'SIGNED_OUT') {
                    console.log("User signed out, clearing state.");
                    setUser(null);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Fetch Products
    const fetchProducts = async () => {
        setLoading(true);
        console.log("Fetching products...");
        try {
            // Explicitly select sold_count and sanitize
            const { data, error } = await supabase.from('products').select('*, sold_count').order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching products:", error);
                showToast("Gagal memuat produk: " + error.message, "error");
            }
            if (data) {
                // FORCE SANITIZE: Ensure sold_count is always a number (0 if null)
                const sanitizedData = data.map(p => ({
                    ...p,
                    sold_count: (p.sold_count === null || p.sold_count === undefined) ? 0 : Number(p.sold_count)
                }));
                console.log("Products fetched:", sanitizedData.length);
                setProducts(sanitizedData);
            }
        } catch (err) {
            console.error("Fetch products exception:", err);
            showToast("Terjadi kesalahan koneksi", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        
        const channel = supabase.channel('products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                console.log('Product change detected:', payload);
                fetchProducts();
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    // Wishlist Logic
    const fetchWishlist = async () => {
        if (!user) {
            setWishlist([]);
            return;
        }
        const { data, error } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('user_id', user.id);
            
        if (error) console.error("Error fetching wishlist:", error);
        else if (data) setWishlist(data.map(w => w.product_id));
    };

    useEffect(() => {
        if (user) fetchWishlist();
        else setWishlist([]);
    }, [user]);

    const handleToggleWishlist = async (product) => {
        if (!user) {
            showToast(t('wishlist_login_required') || "Login untuk menyimpan favorit.", 'error');
            return;
        }

        const isWishlisted = wishlist.includes(product.id);
        
        // Optimistic Update
        setWishlist(prev => isWishlisted 
            ? prev.filter(id => id !== product.id) 
            : [...prev, product.id]
        );

        try {
            if (isWishlisted) {
                const { error } = await supabase
                    .from('wishlists')
                    .delete()
                    .match({ user_id: user.id, product_id: product.id });
                if (error) throw error;
                showToast(t('wishlist_remove_success') || "Dihapus dari Favorit", 'success');
            } else {
                const { error } = await supabase
                    .from('wishlists')
                    .insert({ user_id: user.id, product_id: product.id });
                if (error) throw error;
                showToast(t('wishlist_add_success') || "Ditambahkan ke Favorit", 'success');
            }
        } catch (error) {
            console.error("Wishlist error:", error);
            showToast("Gagal update favorit: " + error.message, 'error');
            // Revert on error
            setWishlist(prev => isWishlisted 
                ? [...prev, product.id] 
                : prev.filter(id => id !== product.id)
            );
        }
    };

    // Fetch Statuses
    const fetchStatuses = async () => {
        const { data, error } = await supabase
            .from('statuses')
            .select(`*, profiles(username, avatar_url)`)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
            
        if (error) console.error("Error fetching statuses:", error);
        else setStatuses(data || []);
    };

    useEffect(() => {
        fetchStatuses();
        
        const channel = supabase.channel('public:statuses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, fetchStatuses)
            .subscribe();
            
        return () => supabase.removeChannel(channel);
    }, []);

    const handleDeleteStatus = async (statusId) => {
        if (!confirm(t('confirm_delete_status'))) return;
        const { error } = await supabase.from('statuses').delete().eq('id', statusId);
        if (error) {
             showToast("Gagal menghapus status", "error");
        } else {
             showToast(t('status_deleted'), "success");
             setViewStatusUserId(null);
        }
    };

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

    // Fetch Groups & Counts
    // Fetch Groups
    const fetchGroups = useCallback(async () => {
        const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching groups:', error);
        else {
            setGroups(data || []);
            // Fetch Member Counts
            const { data: members } = await supabase.from('group_members').select('group_id');
            if (members) {
                const counts = {};
                members.forEach(m => counts[m.group_id] = (counts[m.group_id] || 0) + 1);
                setMemberCounts(counts);
            }
        }
    }, []);

    // Fetch My Joined Groups & Roles
    const fetchMyJoined = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('group_members').select('group_id, role').eq('user_id', user.id);
        if (data) {
            setMyJoinedGroups(new Set(data.map(m => m.group_id)));
            const roles = {};
            data.forEach(m => roles[m.group_id] = m.role);
            setMyGroupRoles(roles);
        }
    }, [user]);

    useEffect(() => {
        if (activeTab !== 'groups') return;
        
        const channels = [];

        fetchGroups();
        if (user) fetchMyJoined();

        if (user) {
            const memberChannel = supabase.channel('my_group_memberships')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, fetchMyJoined)
                .subscribe();
            channels.push(memberChannel);
        }

        const groupChannel = supabase.channel('groups_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchGroups)
            .subscribe();
        channels.push(groupChannel);

        return () => channels.forEach(c => supabase.removeChannel(c));
    }, [activeTab, user]);

    // Fetch Group Messages
    useEffect(() => {
        if (!currentGroup) return;

        const fetchGroupMessages = async () => {
            const { data, error } = await supabase
                .from('group_messages')
                .select('*')
                .eq('group_id', currentGroup.id)
                .order('created_at', { ascending: true });
            
            if (error) console.error('Error fetching group messages:', error);
            else setGroupMessages(data || []);
        };
        fetchGroupMessages();

        const channel = supabase.channel(`group_messages:${currentGroup.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'group_messages', 
                filter: `group_id=eq.${currentGroup.id}` 
            }, payload => {
                // Prevent duplicate from optimistic update
                if (payload.new.sender === user?.name) return;
                setGroupMessages(prev => [...prev, payload.new]);
            })
            .on('postgres_changes', { 
                event: 'DELETE', 
                schema: 'public', 
                table: 'group_messages', 
                filter: `group_id=eq.${currentGroup.id}` 
            }, payload => {
                setGroupMessages(prev => prev.filter(m => m.id !== payload.old.id));
            })
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'group_members', 
                filter: `group_id=eq.${currentGroup.id}` 
            }, () => {
                fetchGroups();
                fetchMyJoined();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentGroup, user, fetchGroups, fetchMyJoined]);

    // Helper Functions
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const toggleLanguage = () => setLanguage(prev => prev === 'id' ? 'en' : 'id');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            // FORCE CLEANUP: Always sign out first to clear stale tokens/state
            // This fixes the "must clear history" bug
            try {
                await supabase.auth.signOut();
            } catch (soError) {
                console.warn("SignOut cleanup failed:", soError);
                // Fallback: Manually clear Supabase token from localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                        localStorage.removeItem(key);
                    }
                });
            }

            // Timeout race to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Waktu login habis. Periksa koneksi internet Anda.")), 15000)
            );

            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                timeoutPromise
            ]);
            
            if (error) {
                console.error("Login Error:", error);
                if (error.message.includes("Email not confirmed")) {
                    showToast(t('alert_email_not_confirmed'), 'error');
                } else if (error.message.includes("Invalid login credentials")) {
                    showToast(t('alert_invalid_login'), 'error');
                } else {
                    showToast(error.message, 'error');
                }
            } else if (data?.user) {
                console.log("Login successful, fetching profile for:", data.user.id);
                
                // Fetch Profile with explicit error handling
                let { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) console.warn("Profile fetch warning:", profileError);

                // Zombie Account Recovery
                if (!profile) {
                    console.log("Profile missing, attempting to recreate...");
                    const fallbackUsername = data.user.user_metadata?.username || data.user.email.split('@')[0];
                    const { error: createError } = await supabase.from('profiles').insert({
                        id: data.user.id,
                        username: fallbackUsername,
                        email: data.user.email,
                        updated_at: new Date()
                    });
                    
                    if (!createError) {
                        profile = { username: fallbackUsername, avatar_url: null };
                        console.log("Profile recreated.");
                    } else {
                        console.error("Failed to recreate profile:", createError);
                    }
                }

                const displayName = profile?.username || data.user.user_metadata?.username || data.user.email.split('@')[0];
                setUser({ ...data.user, name: displayName, avatar_url: profile?.avatar_url });
                showToast(`Welcome ${displayName}!`, 'success');
            }
        } catch (err) {
            console.error("Unexpected Login Error:", err);
            showToast("Login Gagal: " + err.message, 'error');
        } finally {
            setLoading(false);
        }
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
        localStorage.removeItem('cached_user_profile'); // Clear local cache
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
        let file = e.target.files[0];
        if (!file || !user) return;

        // 1. Validate Initial Size (Limit to 6MB before compression attempts)
        if (file.size > 6 * 1024 * 1024) {
            showToast(t('alert_file_size_5mb'), 'error');
            return;
        }

        setUploadingAvatar(true);

        try {
            // 2. Compress Image if > 1MB
            if (file.size > 1 * 1024 * 1024) {
                try {
                    file = await compressImage(file);
                } catch (compError) {
                    console.warn("Compression failed, using original:", compError);
                }
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.name}_avatar_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // 3. Retry Logic (3 attempts)
            let uploadError = null;
            let success = false;

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const { error } = await supabase.storage.from('avatars').upload(filePath, file);
                    if (error) throw error;
                    success = true;
                    break;
                } catch (err) {
                    uploadError = err;
                    console.warn(`Avatar upload attempt ${attempt} failed:`, err);
                    if (attempt < 3) await new Promise(res => setTimeout(res, 1000 * attempt));
                }
            }

            if (!success) {
               if (uploadError && (uploadError.message.includes("Bucket not found") || uploadError.statusCode === "404")) {
                   showToast(t('alert_bucket_avatars_missing'), 'error');
                   setUploadingAvatar(false);
                   return;
               }
               throw uploadError || new Error("Upload failed after 3 attempts");
            }

            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = publicUrlData.publicUrl;

            const { error: dbError } = await supabase.from('profiles').upsert({ 
                id: user.id, // Ensure ID is present for security policies
                username: user.name, 
                email: user.email, 
                avatar_url: publicUrl,
                updated_at: new Date()
            }, { onConflict: 'id' }); // Use ID as conflict target if possible, or fallback to constraints

            if (dbError) throw dbError;

            setUser(prev => ({ ...prev, avatar_url: publicUrl }));
            showToast(t('alert_avatar_success'), 'success');

        } catch (error) {
            console.error("Avatar Upload Error:", error);
            showToast(t('alert_avatar_fail') + (error.message || error), 'error');
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
    
        // 3. Update Sold Count & Optimistic UI
        console.log("Starting sold count update for items:", items);
        
        // Optimistic Update (Immediate Feedback)
        setProducts(prev => prev.map(p => {
            const boughtItem = items.find(i => i.id === p.id);
            if (boughtItem) {
                return { ...p, sold_count: (p.sold_count || 0) + (boughtItem.quantity || 1) };
            }
            return p;
        }));

        let errorOccurred = false;
        await Promise.all(items.map(async (item) => {
             // Use FINAL standardized function
             const { data, error } = await supabase.rpc('increment_sold_count', { 
                 row_id: item.id, 
                 quantity: item.quantity || 1 
             });
             
             if (error) {
                 console.error("Error updating sold count for", item.name, error);
                 // Tampilkan alert error yang harus diklik user agar terbaca
                 alert(`GAGAL Update Terjual untuk ${item.name}:\n${error.message}\n\nMohon screenshot pesan ini.`);
                 errorOccurred = true;
             } else {
                 console.log("Success updating sold count for", item.name, "New Count:", data);
             }
        }));

        // Force refresh to ensure sync
        await fetchProducts();

        // 4. Clear items from cart (for this seller)
        if (!errorOccurred) {
            setCart(prev => prev.filter(item => item.seller !== sellerName));
            showToast("Pesanan dikirim ke chat penjual!", "success");
        } else {
            showToast("Pesanan terkirim tapi gagal update stok.", "warning");
        }
    };

    const handleDeleteProduct = async (product) => {
        if (!confirm(t('confirm_delete_product') || "Yakin ingin menghapus produk ini?")) return;
        // Fix: Case-insensitive check
        if (user.name?.toLowerCase() !== product.seller?.toLowerCase()) return showToast(t('alert_delete_forbidden') || "Anda tidak berhak menghapus produk ini", 'error');

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

    const handleSendMessage = async (text, imageUrl = null, receiverOverride = null, location = null) => {
        if (!text && !imageUrl && !location) return;
        
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
            created_at: new Date().toISOString(),
            ...(location && {
                location_lat: location.lat,
                location_lng: location.lng,
                location_label: location.label || ''
            })
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

    const handleSendGroupMessage = async (text, imageUrl = null) => {
        if ((!text && !imageUrl) || !currentGroup || !user) return;

        const newMsg = {
            group_id: currentGroup.id,
            sender: user.name,
            text: text,
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };

        setGroupMessages(prev => [...prev, newMsg]);

        const { error } = await supabase.from('group_messages').insert({
            group_id: currentGroup.id,
            sender: user.name,
            text: text,
            image_url: imageUrl
        });

        if (error) {
            showToast(t('alert_chat_send_fail') + error.message, 'error');
        }
    };

    const handleGroupChatImageUpload = async (e) => {
        let file = e.target.files[0];
        if (!file) return;

        if (file.size > 6 * 1024 * 1024) {
             showToast(t('alert_file_size_5mb'), 'error');
             return;
        }

        try {
            if (file.size > 1 * 1024 * 1024) {
                try {
                    file = await compressImage(file);
                } catch (compError) {
                    console.warn("Compression failed, using original:", compError);
                }
            }

            const fileName = `group_chat_${Date.now()}_${file.name}`;
            const filePath = `chat_images/${fileName}`;
            
            const { error } = await supabase.storage.from('chat_images').upload(filePath, file);
            if (error) throw error;
            
            const { data } = supabase.storage.from('chat_images').getPublicUrl(filePath);
            handleSendGroupMessage("", data.publicUrl);
        } catch (error) {
            console.error("Group Chat Upload Error:", error);
            showToast(t('alert_send_image_fail') + (error.message || error), 'error');
        }
    };

    const handleJoinGroup = async (groupId, e) => {
        if (e) e.stopPropagation();
        if (!user) return showToast(t('alert_login_group'), 'error');
        
        const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id });
        if (error) {
            showToast("Gagal gabung: " + error.message, 'error');
        } else {
            setMyJoinedGroups(prev => new Set(prev).add(groupId));
            setMyGroupRoles(prev => ({ ...prev, [groupId]: 'member' }));
            setMemberCounts(prev => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));
            showToast("Berhasil gabung!", 'success');
        }
    };

    const handleClearGroupChat = async () => {
        if (!confirm("Apakah Anda yakin ingin menghapus SEMUA percakapan di grup ini? Tindakan ini tidak dapat dibatalkan.")) return;

        const { error } = await supabase
            .from('group_messages')
            .delete()
            .eq('group_id', currentGroup.id);

        if (error) {
            console.error('Error clearing chat:', error);
            showToast('Gagal menghapus percakapan: ' + error.message, 'error');
        } else {
            showToast('Percakapan berhasil dibersihkan', 'success');
            setGroupMessages([]); // Clear local state immediately
        }
    };

    const handleLeaveGroup = async (groupId) => {
        if (!confirm("Yakin ingin keluar grup?")) return;
        const { error } = await supabase.from('group_members').delete().match({ group_id: groupId, user_id: user.id });
        if (error) {
            showToast("Gagal keluar: " + error.message, 'error');
        } else {
            const newSet = new Set(myJoinedGroups);
            newSet.delete(groupId);
            setMyJoinedGroups(newSet);
            setMyGroupRoles(prev => {
                const newRoles = { ...prev };
                delete newRoles[groupId];
                return newRoles;
            });
            setMemberCounts(prev => ({ ...prev, [groupId]: Math.max(0, (prev[groupId] || 1) - 1) }));
            if (currentGroup?.id === groupId) setCurrentGroup(null);
            showToast("Anda keluar grup.", 'success');
        }
    };

    const handleKickMember = async (memberId, groupId) => {
        if (!confirm("Keluarkan anggota ini?")) return;
        const { error } = await supabase.from('group_members').delete().match({ user_id: memberId, group_id: groupId });
        if (error) {
            showToast("Gagal kick: " + error.message, 'error');
        } else {
            setGroupMembersList(prev => prev.filter(m => m.user_id !== memberId));
            setMemberCounts(prev => ({ ...prev, [groupId]: Math.max(0, (prev[groupId] || 1) - 1) }));
            showToast("Anggota dikeluarkan.", 'success');
        }
    };

    const openMembersModal = async (group) => {
        setShowMembersModal(true);
        setLoading(true);
        // Join with profiles to get names
        const { data, error } = await supabase
            .from('group_members')
            .select('*, profiles(username, avatar_url)')
            .eq('group_id', group.id);
        
        if (error) console.error(error);
        else setGroupMembersList(data || []);
        setLoading(false);
    };

    const handleChatImageUpload = async (e) => {
        let file = e.target.files[0];
        if (!file) return;

        // 1. Validate Initial Size (Limit to 6MB)
        if (file.size > 6 * 1024 * 1024) {
             showToast(t('alert_file_size_5mb'), 'error');
             return;
        }

        try {
            // 2. Compress Image if > 1MB
            if (file.size > 1 * 1024 * 1024) {
                try {
                    file = await compressImage(file);
                } catch (compError) {
                    console.warn("Compression failed, using original:", compError);
                }
            }

            const fileName = `chat_${Date.now()}_${file.name}`;
            const filePath = `chat_images/${fileName}`;
            
            // 3. Retry Logic (3 attempts)
            let uploadError = null;
            let success = false;

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const { error } = await supabase.storage.from('chat_images').upload(filePath, file);
                    if (error) throw error;
                    success = true;
                    break;
                } catch (err) {
                    uploadError = err;
                    console.warn(`Chat image upload attempt ${attempt} failed:`, err);
                    if (attempt < 3) await new Promise(res => setTimeout(res, 1000 * attempt));
                }
            }

            if (!success) {
                 if (uploadError && (uploadError.message.includes("Bucket not found") || uploadError.statusCode === "404")) {
                     showToast("Bucket 'chat_images' belum dibuat. Hubungi admin.", 'error');
                     return;
                 }
                 throw uploadError || new Error("Upload failed after 3 attempts");
            }
            
            const { data } = supabase.storage.from('chat_images').getPublicUrl(filePath);
            handleSendMessage("", data.publicUrl);
        } catch (error) {
            console.error("Chat Upload Error:", error);
            showToast(t('alert_send_image_fail') + (error.message || error), 'error');
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

    if (isAuthChecking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 animate-pulse">{t('processing') || 'Memuat data pengguna...'}</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full shadow-md p-1">
                            <img src="/logo.png" alt="Pasar Digital Logo" className="w-full h-full object-contain rounded-full" />
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

            {showCreateGroup && (
                <CreateGroupModal 
                    onClose={() => setShowCreateGroup(false)} 
                    showToast={showToast} 
                    t={t} 
                    user={user} 
                />
            )}
            {showMembersModal && (
                <MembersModal 
                    onClose={() => setShowMembersModal(false)}
                    members={groupMembersList}
                    onKick={handleKickMember}
                    currentGroup={currentGroup}
                    currentUser={user}
                    t={t}
                />
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
            {showLocationPicker && (
                <React.Suspense fallback={<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-sm"><div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                    <LocationPickerModal
                        onClose={() => setShowLocationPicker(false)}
                        onSend={(location) => {
                            if (activeTab === 'chat' && chatPartner) {
                                handleSendMessage("", null, null, location);
                            }
                            setShowLocationPicker(false);
                        }}
                        t={t}
                    />
                </React.Suspense>
            )}
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} t={t} />}
            {showAbout && <AboutModal onClose={() => setShowAbout(false)} t={t} />}
            {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} showToast={showToast} t={t} />}
            {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} user={user} showToast={showToast} t={t} setUser={setUser} />}
            <ProductDetailModal viewProduct={viewProduct} setViewProduct={setViewProduct} setViewImage={setViewImage} user={user} showToast={showToast} handleAddToCart={handleAddToCart} handleStartChat={handleStartChat} handleDeleteProduct={handleDeleteProduct} t={t} />
            <ImageViewModal imageUrl={viewImage} onClose={() => setViewImage(null)} />
            {showCreateStatus && (
                <CreateStatusModal 
                    onClose={() => setShowCreateStatus(false)} 
                    user={user} 
                    showToast={showToast} 
                    t={t} 
                    onSuccess={fetchStatuses}
                />
            )}
            {viewStatusUserId && (
                <StatusViewerModal 
                    onClose={() => setViewStatusUserId(null)} 
                    statuses={statuses.filter(s => s.user_id === viewStatusUserId)} 
                    user={user} 
                    onDelete={handleDeleteStatus}
                    t={t}
                />
            )}

            <div className={`w-full max-w-md bg-gray-50 dark:bg-gray-900 min-h-screen shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-300 ${activeTab === 'chat' && chatPartner ? '' : 'pb-20'}`}>
                {/* Header based on Tab */}
                <div className="bg-white dark:bg-gray-900 p-4 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm">
                   {activeTab === 'market' && (
                       <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-white rounded-full shadow-sm p-0.5 shrink-0">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
                            </div>
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
                   {activeTab === 'wishlist' && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('wishlist_title') || "Favorit Saya"}</h1>}
                   {activeTab === 'groups' && !currentGroup && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('groups_title')}</h1>}
                   {activeTab === 'chat' && !chatPartner && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('chat_title')}</h1>}
                   {activeTab === 'profile' && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('profile_title')}</h1>}
                </div>

                {/* Content */}
                <div className={`flex-1 ${
                    (activeTab === 'chat' && chatPartner) || (activeTab === 'groups' && currentGroup) 
                    ? 'overflow-hidden p-0' 
                    : 'overflow-y-auto p-4 space-y-4'
                }`}>
                    {activeTab === 'wishlist' && (
                        <WishlistView 
                            wishlist={wishlist}
                            products={products}
                            onToggleWishlist={handleToggleWishlist}
                            onAddToCart={(p) => handleAddToCart(p, 1)}
                            onChatSeller={(seller) => handleStartChat(seller)}
                            onViewProduct={(p) => setViewProduct(p)}
                            t={t}
                            isSeller={false} // Wishlist is for buying
                        />
                    )}

                    {activeTab === 'chat' && (
                        <div className="h-full flex flex-col">
                            {chatPartner ? (
                                <div className="flex flex-col h-full">
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
                                    <div className="flex-1 overflow-y-auto p-4 bg-[#E5DDD5] dark:bg-[#0b141a]" style={chatBgStyle}>
                                        {(() => {
                                            const chatMessages = messages.filter(m => (m.sender === user.name && m.receiver === chatPartner) || (m.sender === chatPartner && m.receiver === user.name));
                                            return chatMessages.map((m, i) => {
                                                const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(chatMessages[i-1].created_at).toDateString();
                                                return (
                                                    <React.Fragment key={i}>
                                                        {showDate && <DateSeparator date={m.created_at} t={t} />}
                                                        <ChatBubble message={m} isMe={m.sender === user.name} t={t} />
                                                    </React.Fragment>
                                                );
                                            });
                                        })()}
                                    </div>
                                    <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1 sticky bottom-0 z-50 w-full">
                                        <div className="flex items-center gap-0">
                                            <label className="cursor-pointer text-gray-400 hover:text-teal-600 p-2"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleChatImageUpload} /></label>
                                            <button onClick={() => setShowLocationPicker(true)} className="text-gray-400 hover:text-teal-600 p-2 transition" title="Bagikan Lokasi"><MapPin size={20} /></button>
                                        </div>
                                        <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 border border-transparent focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition min-w-0">
                                            <input 
                                                type="text" 
                                                placeholder={t('chat_input_placeholder')} 
                                                className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-white min-w-0" 
                                                onKeyDown={(e) => { if(e.key === 'Enter') { handleSendMessage(e.target.value); e.target.value = ''; } }} 
                                            />
                                            <button onClick={(e) => { const input = e.currentTarget.previousSibling; handleSendMessage(input.value); input.value = ''; }} className="ml-2 text-teal-600 hover:text-teal-700 transition"><Send size={18} /></button>
                                        </div>
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

                    {activeTab === 'groups' && (
                        <div className="h-full flex flex-col">
                            {currentGroup ? (
                                <div className="flex flex-col h-full">
                                    {/* Header */}
                                    <div className="bg-white dark:bg-gray-900 p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                                       <div className="flex items-center gap-2">
                                           <button onClick={() => setCurrentGroup(null)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"><ArrowLeft size={20} className="text-gray-800 dark:text-white" /></button>
                                           <div className="flex items-center gap-2 cursor-pointer" onClick={() => openMembersModal(currentGroup)}>
                                               <img src={currentGroup.image_url} alt={currentGroup.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                               <div>
                                                   <span className="font-bold text-gray-800 dark:text-white block leading-none">{currentGroup.name}</span>
                                                   <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                        {memberCounts[currentGroup.id] || 0} {t('member_count')} &bull; Info
                                                   </span>
                                               </div>
                                           </div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                           {(currentGroup.created_by === user.name || myGroupRoles[currentGroup.id] === 'admin') && (
                                                <button 
                                                    onClick={handleClearGroupChat} 
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition" 
                                                    title="Bersihkan Percakapan (Admin)"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                           )}
                                           {myJoinedGroups.has(currentGroup.id) && (
                                                <button onClick={() => handleLeaveGroup(currentGroup.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition" title={t('leave_group')}>
                                                    <LogOut size={20} />
                                                </button>
                                           )}
                                       </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 bg-[#E5DDD5] dark:bg-[#0b141a]" style={chatBgStyle}>
                                         {groupMessages.map((m, i) => {
                                             const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(groupMessages[i-1].created_at).toDateString();
                                             return (
                                                 <React.Fragment key={i}>
                                                     {showDate && <DateSeparator date={m.created_at} t={t} />}
                                                     <ChatBubble 
                                                         message={m} 
                                                         isMe={m.sender === user.name} 
                                                         t={t} 
                                                         showSender={m.sender !== user.name} 
                                                     />
                                                 </React.Fragment>
                                             );
                                         })}
                                    </div>

                                    {/* Input */}
                                    <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1 sticky bottom-0 z-50 w-full">
                                        <label className="cursor-pointer text-gray-400 hover:text-teal-600 p-2">
                                             <Camera size={20} />
                                             <input type="file" className="hidden" accept="image/*" onChange={handleGroupChatImageUpload} />
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder={t('chat_input_placeholder')} 
                                            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 text-sm outline-none text-gray-800 dark:text-white border border-transparent focus:border-teal-500 transition min-w-0" 
                                            onKeyDown={(e) => { if(e.key === 'Enter') { handleSendGroupMessage(e.target.value); e.target.value = ''; } }} 
                                        />
                                        <button onClick={(e) => { const input = e.currentTarget.previousSibling; handleSendGroupMessage(input.value); input.value = ''; }} className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 transition shadow-md shadow-teal-500/30 shrink-0"><Send size={18} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl flex items-center justify-between border border-teal-100 dark:border-teal-900/30">
                                         <div>
                                             <h3 className="font-bold text-teal-800 dark:text-teal-400">{t('create_group')}</h3>
                                             <p className="text-xs text-teal-600 dark:text-teal-500">{t('create_group_desc') || "Buat komunitas untuk pelangganmu"}</p>
                                         </div>
                                         <button onClick={() => setShowCreateGroup(true)} className="bg-teal-600 text-white p-2 rounded-lg shadow-md hover:bg-teal-700 transition"><Plus size={20} /></button>
                                     </div>

                                     {groups.length === 0 ? (
                                         <div className="text-center py-10 text-gray-400">
                                             <Users size={48} className="mx-auto mb-2 opacity-20" />
                                             <p>{t('no_groups') || "Belum ada grup komunitas"}</p>
                                         </div>
                                     ) : (
                                         <div className="space-y-2">
                                            {groups.map(group => (
                                                <div key={group.id} onClick={() => setCurrentGroup(group)} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3 cursor-pointer border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition relative">
                                                    <img src={group.image_url} alt={group.name} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-800 dark:text-white">{group.name}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{group.description}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-[10px] text-gray-400">By {group.created_by}</p>
                                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                                                                {memberCounts[group.id] || 0} {t('member_count')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!myJoinedGroups.has(group.id) && (
                                                        <button 
                                                            onClick={(e) => handleJoinGroup(group.id, e)}
                                                            className="bg-teal-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md hover:bg-teal-700 transition z-10"
                                                        >
                                                            {t('join_group_btn')}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                     )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'market' && (
                        <div className="space-y-4">
                            {/* Status List */}
                            <StatusList 
                                statuses={statuses} 
                                user={user} 
                                onAdd={() => setShowCreateStatus(true)} 
                                onViewUser={(userId) => setViewStatusUserId(userId)}
                                t={t}
                            />

                            {/* Filters & Sorting (Dropdowns) */}
                            <div className="flex gap-2">
                                {/* Category Dropdown */}
                                <div className="relative flex-1">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-8 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition shadow-sm"
                                    >
                                        {CATEGORY_KEYS.map(key => (
                                            <option key={key} value={key}>
                                                {t(key)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <Filter size={16} />
                                    </div>
                                </div>

                                {/* Sorting Dropdown */}
                                <div className="relative w-1/3 min-w-[120px]">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-8 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition shadow-sm"
                                    >
                                        <option value="latest">{t('sort_latest')}</option>
                                        <option value="popular">{t('sort_popular')}</option>
                                        <option value="cheap">{t('sort_cheap')}</option>
                                        <option value="expensive">{t('sort_expensive')}</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <BarChart3 size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {(() => {
                                    const filteredProducts = products
                                        .filter(p => {
                                            const matchesCategory = selectedCategory === 'cat_all' || p.category === translations['id'][selectedCategory];
                                            const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
                                            
                                            // Price Filtering Logic
                                            let matchesPrice = true;
                                            const price = parseInt(p.price.split(',')[0].replace(/[^0-9]/g, '')) || 0;

                                            if (sortBy === 'expensive') {
                                                // "Termahal dari 1 juta ke atas"
                                                matchesPrice = price >= 1000000;
                                            } else if (sortBy === 'cheap') {
                                                // "Termurah < 1 juta ke bawah"
                                                matchesPrice = price < 1000000;
                                            }

                                            return matchesCategory && matchesSearch && matchesPrice;
                                        })
                                        .sort((a, b) => {
                                            if (sortBy === 'latest') return new Date(b.created_at) - new Date(a.created_at);
                                            if (sortBy === 'popular') return (b.sold_count || 0) - (a.sold_count || 0);
                                            
                                            const getPrice = (p) => parseInt(p.price.split(',')[0].replace(/[^0-9]/g, '')) || 0;
                                            if (sortBy === 'cheap') return getPrice(a) - getPrice(b);
                                            if (sortBy === 'expensive') return getPrice(b) - getPrice(a);
                                            return 0;
                                        });

                                    return filteredProducts.length === 0 ? (
                                        <div className="col-span-2 flex flex-col items-center justify-center py-10 text-center">
                                            <p className="text-gray-400 mb-4">{t('no_products_found')}</p>
                                            <button 
                                                onClick={() => {
                                                    setLoading(true);
                                                    fetchProducts();
                                                    fetchStatuses();
                                                    setTimeout(() => setLoading(false), 1000);
                                                }}
                                                className="px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-bold hover:bg-teal-100 transition flex items-center gap-2"
                                            >
                                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                                                {t('refresh_data') || "Muat Ulang Data"}
                                            </button>
                                        </div>
                                    ) : (
                                        filteredProducts.map(p => (
                                            <ProductCard 
                                                key={p.id} 
                                                product={p} 
                                                onClick={() => setViewProduct(p)} 
                                                t={t} 
                                                isWishlisted={wishlist.includes(p.id)}
                                                onToggleWishlist={handleToggleWishlist}
                                            />
                                        ))
                                    );
                                })()}
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
                                            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-teal-600 text-white p-1 rounded-full cursor-pointer shadow-md hover:bg-teal-700 transition">
                                        <Camera size={12} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                                    </label>
                                    {uploadingAvatar && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-lg dark:text-white">{user.name}</h2>
                                        <button onClick={() => setShowEditProfile(true)} className="text-gray-400 hover:text-teal-600 transition">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
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
                                        {products.filter(p => p.seller?.toLowerCase() === user.name?.toLowerCase()).reduce((acc, p) => acc + (p.views || 0), 0)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Total dilihat pembeli</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                                        <Package size={16} className="text-orange-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Produk Aktif</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {products.filter(p => p.seller?.toLowerCase() === user.name?.toLowerCase()).length}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Produk di etalase</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                                        <ShoppingBag size={16} className="text-blue-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Produk Terjual</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {products.filter(p => p.seller?.toLowerCase() === user.name?.toLowerCase()).reduce((acc, p) => acc + (p.sold_count || 0), 0)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Total unit terjual</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                                        <DollarSign size={16} className="text-green-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Total Pendapatan</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-800 dark:text-white truncate">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                                            products.filter(p => p.seller?.toLowerCase() === user.name?.toLowerCase()).reduce((acc, p) => {
                                                const price = parseInt(p.price.split(',')[0].replace(/[^0-9]/g, '')) || 0;
                                                return acc + (price * (p.sold_count || 0));
                                            }, 0)
                                        )}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Estimasi pendapatan kotor</p>
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

                            <button onClick={() => setShowChangePassword(true)} className="w-full bg-orange-50 dark:bg-orange-900/30 p-4 rounded-xl text-orange-600 dark:text-orange-400 text-sm font-bold hover:bg-orange-100 transition flex items-center justify-center gap-2">
                                <Lock size={18} /> {t('change_password')}
                            </button>

                            <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 transition">{t('btn_logout')}</button>
                            
                            <button onClick={() => setShowHelp(true)} className="w-full bg-teal-50 dark:bg-teal-900/30 p-4 rounded-xl text-teal-600 dark:text-teal-400 text-sm font-bold hover:bg-teal-100 transition flex items-center justify-center gap-2">
                                <HelpCircle size={18} /> {t('help')}
                            </button>

                            <button onClick={() => setShowAbout(true)} className="w-full bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2">
                                <Info size={18} /> {t('about_menu')}
                            </button>

                            <button 
                                onClick={async () => {
                                    if (confirm('Apakah Anda yakin ingin mereset aplikasi? Ini akan menghapus semua data offline dan memuat ulang aplikasi.')) {
                                        try {
                                            // 1. Unregister SW
                                            if ('serviceWorker' in navigator) {
                                                const registrations = await navigator.serviceWorker.getRegistrations();
                                                for (const registration of registrations) {
                                                    await registration.unregister();
                                                }
                                            }
                                            // 2. Clear Caches
                                            if ('caches' in window) {
                                                const keys = await caches.keys();
                                                await Promise.all(keys.map(key => caches.delete(key)));
                                            }
                                            // 3. Clear LocalStorage
                                            localStorage.clear();
                                            // 4. Reload
                                            window.location.reload(true);
                                        } catch (e) {
                                            console.error("Reset failed", e);
                                            window.location.reload();
                                        }
                                    }
                                }}
                                className="w-full bg-gray-100 dark:bg-gray-700 p-4 rounded-xl text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} /> Reset Aplikasi (Perbaiki Error)
                            </button>

                            <button onClick={handleDeleteAccount} className="w-full p-3 text-red-400 text-xs font-medium hover:text-red-600 transition underline">{t('btn_delete_account')}</button>
                            
                            <div className="text-center mt-6 pb-4">
                                <p className="text-xs text-gray-400 font-medium">Develop by Pasar Digital Community</p>
                                <p className="text-xs text-gray-400">Email: pasardigital1@gmail.com</p>
                            </div>
                        </div>
                    )}
                </div>

                {!(activeTab === 'chat' && chatPartner) && !(activeTab === 'groups' && currentGroup) && <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} t={t} />}

                {/* PWA Update Toast */}
                {needRefresh && (
                    <div className="fixed bottom-24 left-4 right-4 md:bottom-4 md:right-4 md:left-auto md:w-96 bg-teal-600 text-white p-4 rounded-xl shadow-lg shadow-teal-900/20 z-[100] flex justify-between items-center animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <div>
                            <p className="font-bold text-sm">Update Tersedia</p>
                            <p className="text-xs opacity-90">Versi baru aplikasi siap digunakan.</p>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setNeedRefresh(false)}
                                className="p-2 text-teal-100 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                            <button 
                                onClick={() => updateServiceWorker(true)}
                                className="bg-white text-teal-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-50 transition"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
