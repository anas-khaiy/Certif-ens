import React, { useState, useEffect } from 'react';
import {
    Mail,
    Lock,
    Camera,
    Save,
    Shield,
    Loader2,
    Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api-client';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

const SettingsPage = () => {
    const [profile, setProfile] = useState({
        nom: '',
        prenom: '',
        email: '',
        photoProfile: 'default.png'
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [aiModel, setAiModel] = useState('mistral');
    const [updatingAiModel, setUpdatingAiModel] = useState(false);

    const API_BASE_URL = API_ADMIN;

    useEffect(() => {
        fetchProfile();
        fetchSettings();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setProfile(response.data);
            // Sync local storage for header
            localStorage.setItem('adminNom', response.data.nom);
            localStorage.setItem('adminPrenom', response.data.prenom);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings/OLLAMA_MODEL');
            if (response.data && response.data.value) {
                setAiModel(response.data.value);
            }
        } catch (error) {
            // Ignore if not found
        }
    };


    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Restriction check: File format
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({
                type: 'error',
                text: 'Format invalide. Veuillez utiliser JPG, JPEG ou PNG.'
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            return;
        }

        // Restriction check: File size (e.g., 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setMessage({
                type: 'error',
                text: 'Image trop volumineuse. La taille maximum est de 5Mo.'
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setMessage({ type: 'info', text: 'Téléchargement de l\'image...' });
            const response = await api.post('/auth/photo', formData);

            // The response returns the new filename
            setProfile(prev => ({ ...prev, photoProfile: response.data }));
            setMessage({ type: 'success', text: 'Photo de profil mise à jour !' });

            // Trigger a re-render for other components if needed
            window.dispatchEvent(new Event('profileUpdate'));
        } catch (error) {
            console.error('Error updating avatar:', error);
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour de la photo' });
        } finally {
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            await api.put('/auth/profile', {
                nom: profile.nom,
                prenom: profile.prenom
            });
            localStorage.setItem('adminNom', profile.nom);
            localStorage.setItem('adminPrenom', profile.prenom);
            setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
            window.dispatchEvent(new Event('profileUpdate'));
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
        } finally {
            setUpdatingProfile(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }

        setUpdatingPassword(true);
        try {
            await api.put('/auth/password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data || 'Erreur lors de la modification du mot de passe'
            });
        } finally {
            setUpdatingPassword(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleAiModelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingAiModel(true);
        try {
            await api.post('/admin/settings/OLLAMA_MODEL', { value: aiModel });
            setMessage({ type: 'success', text: 'Modèle IA mis à jour avec succès !' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du modèle IA' });
        } finally {
            setUpdatingAiModel(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const avatarUrl = `${API_BASE_URL}/files/profiles/${profile.photoProfile || 'default.png'}`;

    return (
        <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-12 px-4">
            <div className="flex justify-between items-center mb-1">
                <div>
                    <h2 className="text-2xl font-bold text-text">Paramètres du compte</h2>
                </div>
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`px-4 py-1.5 rounded-lg border ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
                            message.type === 'info' ? 'bg-primary/10 border-primary/20 text-primary' :
                                'bg-error/10 border-error/20 text-error'
                            } font-semibold text-xs flex items-center gap-2`}
                    >
                        <Shield size={14} />
                        {message.text}
                    </motion.div>
                )}
            </div>

            <div className="max-w-3xl mx-auto w-full space-y-[30px]">
                {/* Information Profil Card */}
                <div className="glass p-3 mb-[30px]" style={{ marginBottom: 30 }}>
                    <div className="flex items-center gap-3 border-b border-glass-border pb-3 mb-[30px]" style={{ marginBottom: 30 }}>
                        <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-glass-border shadow-sm bg-primary flex items-center justify-center font-bold text-xl text-white">
                                {!imgError && profile.photoProfile && profile.photoProfile !== 'default.png' ? (
                                    <img
                                        key={profile.photoProfile} // Force refresh when photo changes
                                        src={avatarUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <span>{profile.prenom?.[0] || 'A'}{profile.nom?.[0] || 'D'}</span>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center cursor-pointer shadow-md hover:bg-primary-hover transition-all border-4 border-surface">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text">Informations Personnelles</h3>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Mettez à jour votre profil</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="form-group mb-4">
                                <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block">Nom</label>
                                <input
                                    type="text"
                                    className="form-input h-8 text-xs"
                                    value={profile.nom}
                                    onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block">Prénom</label>
                                <input
                                    type="text"
                                    className="form-input h-8 text-xs"
                                    value={profile.prenom}
                                    onChange={(e) => setProfile({ ...profile, prenom: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block font-bold text-primary">Adresse Email (Non modifiable)</label>
                            <div className="relative">
                                <div className="absolute text-text-muted pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)', marginLeft: '20px' }}>
                                    <Mail size={14} />
                                </div>
                                <input
                                    type="email"
                                    className="form-input h-8 text-xs bg-surface-hover cursor-not-allowed opacity-70"
                                    style={{ paddingLeft: '50px' }}
                                    value={profile.email}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={updatingProfile}
                                className="primary px-4 h-7 text-[10px] font-bold uppercase tracking-wide rounded-md flex items-center gap-2"
                            >
                                {updatingProfile ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Section */}
                <div className="glass p-3 mb-[30px]">
                    <div className="flex items-center gap-3 border-b border-glass-border pb-3 mb-[30px]" style={{ marginBottom: 30 }}>
                        <div className="p-1.5 bg-secondary/10 rounded-lg text-secondary">
                            <Lock size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text">Sécurité</h3>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Changer votre mot de passe</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                        <div className="form-group mb-4">
                            <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block">Mot de passe actuel</label>
                            <div className="relative">
                                <div className="absolute text-text-muted pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)', marginLeft: '20px' }}>
                                    <Lock size={14} />
                                </div>
                                <input
                                    type="password"
                                    className="form-input h-8 text-xs"
                                    style={{ paddingLeft: '50px' }}
                                    placeholder="••••••••"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="form-group mb-4">
                                <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block">Nouveau mot de passe</label>
                                <div className="relative">
                                    <div className="absolute text-text-muted pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)', marginLeft: '20px' }}>
                                        <Lock size={14} />
                                    </div>
                                    <input
                                        type="password"
                                        className="form-input h-8 text-xs"
                                        style={{ paddingLeft: '50px' }}
                                        placeholder="••••••••"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block">Confirmation</label>
                                <div className="relative">
                                    <div className="absolute text-text-muted pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)', marginLeft: '20px' }}>
                                        <Lock size={14} />
                                    </div>
                                    <input
                                        type="password"
                                        className="form-input h-8 text-xs"
                                        style={{ paddingLeft: '50px' }}
                                        placeholder="••••••••"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={updatingPassword}
                                className="primary px-4 h-7 bg-secondary hover:bg-secondary/80 text-[10px] font-bold uppercase tracking-wide rounded-md flex items-center gap-2"
                            >
                                {updatingPassword ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Modifier
                            </button>
                        </div>
                    </form>
                </div>

                {/* AI Model Section */}
                <div className="glass p-3 mb-[30px]">
                    <div className="flex items-center gap-3 border-b border-glass-border pb-3 mb-[30px]" style={{ marginBottom: 30 }}>
                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                            <Cpu size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text">Intelligence Artificielle</h3>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Choisir le modèle IA local</p>
                        </div>
                    </div>

                    <form onSubmit={handleAiModelSubmit} className="space-y-3">
                        <div className="form-group mb-4">
                            <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block">Modèle Ollama (Local)</label>
                            <div className="relative">
                                <select
                                    className="form-input h-8 text-xs bg-surface w-full"
                                    value={aiModel}
                                    onChange={(e) => setAiModel(e.target.value)}
                                >
                                    <option value="mistral">Mistral (7B) - Standard</option>
                                    <option value="qwen2.5:7b">Qwen 2.5 (7B) - Haute qualité / Français</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={updatingAiModel}
                                className="primary px-4 h-7 bg-blue-500 hover:bg-blue-600 text-[10px] font-bold uppercase tracking-wide rounded-md flex items-center gap-2"
                            >
                                {updatingAiModel ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
