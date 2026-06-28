import React, { useState, useEffect } from 'react';

import { Plus, Target, CheckCircle, AlertCircle, FileText, Send } from 'lucide-react';
import api from '../api/api-client';
import type { Sujet, SujetPropositionConfig } from '../types';

const ProposerSujetPage = () => {
    const [config, setConfig] = useState<SujetPropositionConfig | null>(null);
    const [sujets, setSujets] = useState<Sujet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form state
    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [objectifs, setObjectifs] = useState<string[]>(['']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [configRes, sujetsRes] = await Promise.all([
                api.get('/sujets/config').catch(err => ({ data: null })),
                api.get('/sujets/mes-propositions').catch(err => ({ data: [] }))
            ]);
            
            setConfig(configRes.data);
            setSujets(sujetsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddObjectif = () => setObjectifs([...objectifs, '']);
    const handleRemoveObjectif = (index: number) => setObjectifs(objectifs.filter((_, i) => i !== index));
    const handleObjectifChange = (index: number, value: string) => {
        const newObj = [...objectifs];
        newObj[index] = value;
        setObjectifs(newObj);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            setMessage(null);
            
            const validObjectifs = objectifs.filter(o => o.trim() !== '');
            if (!titre.trim() || !description.trim() || validObjectifs.length === 0) {
                setMessage({ text: 'Veuillez remplir tous les champs obligatoires.', type: 'error' });
                return;
            }

            const response = await api.post('/sujets', {
                titre,
                description,
                objectifs: validObjectifs
            });

            setSujets([...sujets, response.data]);
            setTitre('');
            setDescription('');
            setObjectifs(['']);
            setMessage({ text: 'Sujet proposé avec succès !', type: 'success' });
        } catch (error: any) {
            console.error('Error proposing sujet:', error);
            setMessage({ text: error.response?.data || 'Erreur lors de la proposition du sujet.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!config) {
        return (
            <div className="p-4 sm:p-8 max-w-5xl mx-auto flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <AlertCircle size={64} className="text-text-muted" />
                <h1 className="text-2xl font-bold text-text">Aucune campagne en cours</h1>
                <p className="text-text-muted">Vous n'êtes pas autorisé à proposer des sujets pour le moment.</p>
            </div>
        );
    }

    const remaining = config.nombreSujetsParFormateur - sujets.length;
    const canPropose = remaining > 0;

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Proposer des Sujets</h1>
                    <p className="text-text-muted">Proposez des sujets qui seront affectés aux apprenants.</p>
                </div>
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold ${remaining > 0 ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                    <Target size={20} />
                    {sujets.length} / {config.nombreSujetsParFormateur} Proposés
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {canPropose ? (
                        <div className="bg-surface/50 backdrop-blur-xl border-glass-border rounded-xl border overflow-hidden">
                            <div className="p-6 pb-2">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Plus size={20} className="text-primary" />
                                    Nouveau Sujet
                                </h2>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-2">Titre du sujet *</label>
                                        <input 
                                            type="text" 
                                            value={titre}
                                            onChange={e => setTitre(e.target.value)}
                                            placeholder="Ex: Application de gestion de stock"
                                            className="w-full bg-surface border border-glass-border rounded-xl px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-2">Description *</label>
                                        <textarea 
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            rows={4}
                                            placeholder="Description détaillée du projet..."
                                            className="w-full bg-surface border border-glass-border rounded-xl px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-2">Objectifs *</label>
                                        <div className="space-y-2">
                                            {objectifs.map((obj, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={obj}
                                                        onChange={e => handleObjectifChange(idx, e.target.value)}
                                                        placeholder={`Objectif ${idx + 1}`}
                                                        className="flex-1 bg-surface border border-glass-border rounded-xl px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    />
                                                    {objectifs.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveObjectif(idx)}
                                                            className="p-2 text-error hover:bg-error/10 rounded-xl transition-all"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleAddObjectif}
                                            className="mt-2 text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
                                        >
                                            <Plus size={16} /> Ajouter un objectif
                                        </button>
                                    </div>
                                    
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            <Send size={18} />
                                            {isSubmitting ? 'Envoi...' : 'Soumettre le Sujet'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-success/5 border border-success/20 h-full flex flex-col items-center justify-center p-8 text-center rounded-xl">
                            <CheckCircle size={64} className="text-success mb-4" />
                            <h2 className="text-xl font-bold text-success mb-2">Quota Atteint</h2>
                            <p className="text-text-muted">Vous avez proposé le nombre maximum de sujets requis ({config.nombreSujetsParFormateur}). Merci de votre participation !</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-surface/50 backdrop-blur-xl border-glass-border h-full max-h-[800px] flex flex-col rounded-xl border overflow-hidden">
                        <div className="p-6 pb-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                Mes Propositions ({sujets.length})
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 px-4 pb-4">
                            {sujets.length === 0 ? (
                                <p className="text-center text-text-muted py-8">Aucun sujet proposé pour le moment.</p>
                            ) : (
                                <div className="space-y-4 mt-2">
                                    {sujets.map(s => (
                                        <div key={s.id} className="p-4 rounded-xl border border-glass-border bg-surface hover:border-primary/50 transition-colors">
                                            <h3 className="font-bold text-text mb-1 text-sm">{s.titre}</h3>
                                            <p className="text-xs text-text-muted line-clamp-2">{s.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposerSujetPage;
