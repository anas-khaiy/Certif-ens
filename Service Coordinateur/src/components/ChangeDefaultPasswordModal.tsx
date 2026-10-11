import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/api-client';

interface ChangeDefaultPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ChangeDefaultPasswordModal: React.FC<ChangeDefaultPasswordModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword) {
            setError('Veuillez saisir votre mot de passe actuel.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        if (newPassword === currentPassword) {
            setError('Le nouveau mot de passe doit être différent du mot de passe actuel.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('La confirmation ne correspond pas au nouveau mot de passe.');
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/me', {
                currentPassword: currentPassword.trim(),
                password: newPassword.trim(),
            });

            setSuccess('Mot de passe mis à jour avec succès !');
            localStorage.setItem('mustChangePassword', 'false');

            setTimeout(() => {
                onSuccess();
            }, 1200);
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                (typeof err.response?.data === 'string' ? err.response?.data : null) ||
                'Erreur lors du changement de mot de passe. Vérifiez votre mot de passe actuel.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-text">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight text-text">
                            Mise à jour du mot de passe
                        </h2>
                        <p className="text-xs text-text-muted leading-relaxed">
                            Vous utilisez encore le mot de passe par défaut. Pour sécuriser votre compte, veuillez le modifier.
                        </p>
                    </div>
                </div>

                {/* Status messages */}
                {error && (
                    <div className="flex items-center gap-2 p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-3 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Mot de passe actuel
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Mot de passe actuel (ex: email)"
                                required
                                className="w-full pl-9 pr-10 py-2.5 bg-surface-hover/50 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text transition"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Nouveau mot de passe (min. 6 caractères)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Au moins 6 caractères"
                                required
                                minLength={6}
                                className="w-full pl-9 pr-10 py-2.5 bg-surface-hover/50 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text transition"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Confirmer le nouveau mot de passe
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirmez le nouveau mot de passe"
                                required
                                minLength={6}
                                className="w-full pl-9 pr-10 py-2.5 bg-surface-hover/50 border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text transition"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-xl transition"
                        >
                            Plus tard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Mise à jour...</span>
                                </>
                            ) : (
                                <span>Enregistrer</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangeDefaultPasswordModal;
