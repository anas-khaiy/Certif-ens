import { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/api-client';

const DeadlinesPage = () => {
    const [deadlines, setDeadlines] = useState({
        DEADLINE_DEPOT_1: '',
        DEADLINE_DEPOT_1_ENABLED: 'false',
        DEADLINE_DEPOT_2: '',
        DEADLINE_DEPOT_2_ENABLED: 'false',
        DEADLINE_FINAL: '',
        DEADLINE_FINAL_ENABLED: 'false'
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchDeadlines();
    }, []);

    const fetchDeadlines = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/settings');
            const data = response.data;
            setDeadlines({
                DEADLINE_DEPOT_1: data.DEADLINE_DEPOT_1 || '',
                DEADLINE_DEPOT_1_ENABLED: data.DEADLINE_DEPOT_1_ENABLED || 'false',
                DEADLINE_DEPOT_2: data.DEADLINE_DEPOT_2 || '',
                DEADLINE_DEPOT_2_ENABLED: data.DEADLINE_DEPOT_2_ENABLED || 'false',
                DEADLINE_FINAL: data.DEADLINE_FINAL || '',
                DEADLINE_FINAL_ENABLED: data.DEADLINE_FINAL_ENABLED || 'false'
            });
        } catch (error) {
            console.error("Erreur lors de la récupération des dates", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await api.post('/settings', deadlines);
            setMessage({ type: 'success', text: 'Les dates limites ont été sauvegardées avec succès.' });
            
            // Auto hide message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (error) {
            console.error("Erreur de sauvegarde", error);
            setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des dates limites.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDeadlines(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setDeadlines(prev => ({
            ...prev,
            [name]: checked ? 'true' : 'false'
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <Calendar className="text-primary" size={28} />
                        Dates Limites de Dépôt
                    </h2>
                    <p className="text-text-muted mt-1">Configurez les dates limites pour les différents dépôts des apprenants.</p>
                </div>
            </div>

            {/* Form */}
            <div className="glass p-8 rounded-2xl max-w-3xl">
                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 font-medium ${
                        message.type === 'success' 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-error/10 text-error border border-error/20'
                    }`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : null}
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="form-group bg-surface-hover/5 p-5 rounded-xl border border-glass-border">
                        <div className="flex justify-between items-center mb-2">
                            <label className="form-label font-bold text-lg mb-0">1er Dépôt (Rapport Intermédiaire)</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className={`text-sm font-bold ${deadlines.DEADLINE_DEPOT_1_ENABLED === 'true' ? 'text-primary' : 'text-text-muted'}`}>
                                    {deadlines.DEADLINE_DEPOT_1_ENABLED === 'true' ? 'Activé' : 'Désactivé'}
                                </span>
                                <input
                                    type="checkbox"
                                    name="DEADLINE_DEPOT_1_ENABLED"
                                    checked={deadlines.DEADLINE_DEPOT_1_ENABLED === 'true'}
                                    onChange={handleCheckboxChange}
                                    className="w-5 h-5 rounded border-glass-border bg-background cursor-pointer accent-primary"
                                />
                            </label>
                        </div>
                        <p className="text-sm text-text-muted mb-4">La date limite pour soumettre la première version ou le rapport d'avancement.</p>
                        <input
                            type="datetime-local"
                            name="DEADLINE_DEPOT_1"
                            value={deadlines.DEADLINE_DEPOT_1}
                            onChange={handleChange}
                            disabled={deadlines.DEADLINE_DEPOT_1_ENABLED !== 'true'}
                            className="form-input text-lg w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="form-group bg-surface-hover/5 p-5 rounded-xl border border-glass-border">
                        <div className="flex justify-between items-center mb-2">
                            <label className="form-label font-bold text-lg mb-0">2ème Dépôt</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className={`text-sm font-bold ${deadlines.DEADLINE_DEPOT_2_ENABLED === 'true' ? 'text-primary' : 'text-text-muted'}`}>
                                    {deadlines.DEADLINE_DEPOT_2_ENABLED === 'true' ? 'Activé' : 'Désactivé'}
                                </span>
                                <input
                                    type="checkbox"
                                    name="DEADLINE_DEPOT_2_ENABLED"
                                    checked={deadlines.DEADLINE_DEPOT_2_ENABLED === 'true'}
                                    onChange={handleCheckboxChange}
                                    className="w-5 h-5 rounded border-glass-border bg-background cursor-pointer accent-primary"
                                />
                            </label>
                        </div>
                        <p className="text-sm text-text-muted mb-4">La date limite pour la soumission de la deuxième version corrigée.</p>
                        <input
                            type="datetime-local"
                            name="DEADLINE_DEPOT_2"
                            value={deadlines.DEADLINE_DEPOT_2}
                            onChange={handleChange}
                            disabled={deadlines.DEADLINE_DEPOT_2_ENABLED !== 'true'}
                            className="form-input text-lg w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="form-group bg-surface-hover/5 p-5 rounded-xl border border-glass-border">
                        <div className="flex justify-between items-center mb-2">
                            <label className="form-label font-bold text-lg mb-0">Dépôt Final</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className={`text-sm font-bold ${deadlines.DEADLINE_FINAL_ENABLED === 'true' ? 'text-primary' : 'text-text-muted'}`}>
                                    {deadlines.DEADLINE_FINAL_ENABLED === 'true' ? 'Activé' : 'Désactivé'}
                                </span>
                                <input
                                    type="checkbox"
                                    name="DEADLINE_FINAL_ENABLED"
                                    checked={deadlines.DEADLINE_FINAL_ENABLED === 'true'}
                                    onChange={handleCheckboxChange}
                                    className="w-5 h-5 rounded border-glass-border bg-background cursor-pointer accent-primary"
                                />
                            </label>
                        </div>
                        <p className="text-sm text-text-muted mb-4">La date limite absolue pour la soumission du rapport final de PFE.</p>
                        <input
                            type="datetime-local"
                            name="DEADLINE_FINAL"
                            value={deadlines.DEADLINE_FINAL}
                            onChange={handleChange}
                            disabled={deadlines.DEADLINE_FINAL_ENABLED !== 'true'}
                            className="form-input text-lg w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="pt-6 border-t border-glass-border">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="primary px-8 h-12 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Sauvegarder les dates
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeadlinesPage;
