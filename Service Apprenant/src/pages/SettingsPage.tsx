import React, { useState, useEffect } from 'react';
import {
    Mail,
    Lock,
    Camera,
    Save,
    Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import defaultProfile from '../assets/profile.png';
import api from '../api/api-client';

const SettingsPage = () => {
    // State for profile
    const [profile, setProfile] = useState({
        nom: '',
        prenom: '',
        email: '',
        avatar: ''
    });

    // State for password change
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                const avatarFileName = response.data.photoProfile || '';
                const formatAvatarUrl = (fileName: string) => {
                    if (!fileName) return '';
                    if (fileName.startsWith('http')) return fileName;
                    return `http://localhost:8082/api/v1/files/profiles/${fileName}`;
                };

                setProfile({
                    nom: response.data.nom || '',
                    prenom: response.data.prenom || '',
                    email: response.data.email || '',
                    avatar: formatAvatarUrl(avatarFileName)
                });

                const userStr = localStorage.getItem('user');
                if (userStr) {
                    localStorage.setItem('user', JSON.stringify({
                        ...JSON.parse(userStr),
                        ...response.data
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, []);

    // Handle avatar change
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Optimistic update
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile((prev: any) => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);

            // Upload via API
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await api.post('/files/profiles/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const fileName = response.data;
                const newAvatarUrl = `http://localhost:8082/api/v1/files/profiles/${fileName}`;

                // Update local profile with the actual URL
                setProfile((prev: any) => ({ ...prev, avatar: newAvatarUrl }));

                // Update user in localStorage
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const obj = JSON.parse(userStr);
                    obj.photoProfile = fileName;
                    localStorage.setItem('user', JSON.stringify(obj));
                    window.dispatchEvent(new Event('storage'));
                }

                setMessage({ type: 'success', text: 'Photo de profil mise à jour !' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } catch (error) {
                console.error('Error uploading avatar:', error);
                setMessage({ type: 'error', text: 'Erreur lors de la mise à jour de la photo.' });
            }
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/auth/me', { nom: profile.nom, prenom: profile.prenom });
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const obj = JSON.parse(userStr);
                obj.nom = profile.nom;
                obj.prenom = profile.prenom;
                localStorage.setItem('user', JSON.stringify(obj));
                window.dispatchEvent(new Event('storage'));
            }
            setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwords.new.trim()) {
            setMessage({ type: 'error', text: 'Le nouveau mot de passe ne peut pas être vide.' });
            return;
        }
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
            return;
        }
        try {
            await api.put('/auth/me', { currentPassword: passwords.current, password: passwords.new });
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la modification. Vérifiez votre mot de passe actuel.' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12 px-4 pt-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-text tracking-tight">Paramètres du compte</h1>
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-4 py-2 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-50/10 border-rose-500/20 text-rose-500'} font-bold text-sm shadow-sm flex items-center gap-2`}
                    >
                        <Shield size={16} />
                        {message.text}
                    </motion.div>
                )}
            </div>

            <div className="space-y-8">
                {/* Information Profil Card */}
                <div className="bg-surface rounded-[2rem] border border-glass-border p-8 relative overflow-hidden group shadow-xl">
                    <div className="flex items-start gap-6 mb-10">
                        <div className="relative group/avatar">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-background shadow-inner bg-background flex items-center justify-center transition-transform group-hover/avatar:scale-105 duration-300">
                                <img
                                    src={profile.avatar || defaultProfile}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label className="absolute -bottom-2 -left-2 w-10 h-10 bg-surface text-primary rounded-2xl flex items-center justify-center cursor-pointer shadow-xl hover:bg-surface-hover transition-all border border-glass-border active:scale-90 z-10">
                                <Camera size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div className="pt-2">
                            <h3 className="text-xl font-black text-text leading-none mb-2">Informations Personnelles</h3>
                            <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Mettez à jour votre profil</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Nom</label>
                                <input
                                    type="text"
                                    placeholder="Votre nom"
                                    className="w-full h-14 bg-background border border-glass-border rounded-2xl px-6 text-text font-bold placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    value={profile.nom}
                                    onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Prénom</label>
                                <input
                                    type="text"
                                    placeholder="Votre prénom"
                                    className="w-full h-14 bg-background border border-glass-border rounded-2xl px-6 text-text font-bold placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    value={profile.prenom}
                                    onChange={(e) => setProfile({ ...profile, prenom: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Adresse Email (non modifiable)</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-hover/input:text-primary transition-colors" size={20} />
                                <input
                                    type="email"
                                    className="w-full h-14 bg-background/50 border border-glass-border rounded-2xl pl-16 pr-6 text-text-muted font-bold cursor-not-allowed outline-none"
                                    value={profile.email}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="flex items-center gap-3 px-10 h-14 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95">
                                <Save size={18} />
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Section */}
                <div className="bg-surface rounded-[2rem] border border-glass-border p-8 relative overflow-hidden shadow-xl">
                    <div className="flex items-start gap-6 mb-10 border-b border-glass-border pb-8">
                        <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-text-muted">
                            <Lock size={24} />
                        </div>
                        <div className="pt-1">
                            <h3 className="text-xl font-black text-text leading-none mb-2">Sécurité</h3>
                            <p className="text-sm text-text-muted font-bold uppercase tracking-widest">Changer votre mot de passe</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Mot de passe actuel</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-hover/input:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    className="w-full h-14 bg-background border border-glass-border rounded-2xl pl-16 pr-6 text-text font-bold placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-hover/input:text-primary transition-colors" size={20} />
                                    <input
                                        type="password"
                                        className="w-full h-14 bg-background border border-glass-border rounded-2xl pl-16 pr-6 text-text font-bold placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Confirmation</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-hover/input:text-primary transition-colors" size={20} />
                                    <input
                                        type="password"
                                        className="w-full h-14 bg-background border border-glass-border rounded-2xl pl-16 pr-6 text-text font-bold placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="flex items-center gap-3 px-10 h-14 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95">
                                <Save size={18} />
                                Modifier
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
