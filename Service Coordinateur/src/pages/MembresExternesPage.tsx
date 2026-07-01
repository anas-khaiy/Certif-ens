import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, Loader2, Search, X, Check, Building2, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface MembreExterne {
    id: number; nom: string; prenom: string;
    email?: string; affiliation?: string; telephone?: string; specialite?: string;
}

const MembresExternesPage = () => {
    const [membres, setMembres] = useState<MembreExterne[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<MembreExterne | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ nom: '', prenom: '', email: '', affiliation: '', telephone: '', specialite: '' });

    const fetchMembres = async () => {
        setLoading(true);
        try {
            const res = await api.get<MembreExterne[]>('/membres-externes');
            setMembres(res.data);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { fetchMembres(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ nom: '', prenom: '', email: '', affiliation: '', telephone: '', specialite: '' });
        setShowModal(true);
    };

    const openEdit = (m: MembreExterne) => {
        setEditing(m);
        setForm({ nom: m.nom, prenom: m.prenom, email: m.email || '', affiliation: m.affiliation || '', telephone: m.telephone || '', specialite: m.specialite || '' });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.nom || !form.prenom) return;
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/membres-externes/${editing.id}`, form);
            } else {
                await api.post('/membres-externes', form);
            }
            setShowModal(false);
            fetchMembres();
        } catch {}
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Supprimer ce membre externe ?')) return;
        try {
            await api.delete(`/membres-externes/${id}`);
            fetchMembres();
        } catch {}
    };

    const getInitials = (p?: string, n?: string) =>
        `${(p?.[0] || '').toUpperCase()}${(n?.[0] || '').toUpperCase()}`;

    const filtered = membres.filter(m =>
        `${m.prenom} ${m.nom} ${m.email || ''} ${m.affiliation || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Membres Externes</h2>
                    <p className="text-text-muted">Gérez les examinateurs et rapporteurs externes pour les soutenances.</p>
                </div>
                <button onClick={openCreate} className="primary action-btn flex items-center gap-2 px-5 py-2.5 text-sm font-bold whitespace-nowrap">
                    <Plus size={18} /> Ajouter
                </button>
            </div>

            <div className="glass overflow-hidden">
                <div className="p-6 border-b border-glass-border">
                    <div className="search-container max-w-md">
                        <div className="search-icon"><Search size={18} /></div>
                        <input
                            type="text"
                            placeholder="Rechercher un membre..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun membre externe trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                    <th className="py-3 px-6 text-left">Membre</th>
                                    <th className="py-3 px-4 text-left">Email</th>
                                    <th className="py-3 px-4 text-left">Affiliation</th>
                                    <th className="py-3 px-4 text-left">Téléphone</th>
                                    <th className="py-3 px-4 text-left">Spécialité</th>
                                    <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border">
                                {filtered.map(m => (
                                    <tr key={m.id} className="hover:bg-surface-hover/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-warning/20 shrink-0">
                                                    {getInitials(m.prenom, m.nom)}
                                                </div>
                                                <span className="font-bold text-text">{m.prenom} {m.nom}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-text-muted">
                                            {m.email ? (
                                                <span className="flex items-center gap-1"><Mail size={12} />{m.email}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-text-muted">
                                            {m.affiliation ? (
                                                <span className="flex items-center gap-1"><Building2 size={12} />{m.affiliation}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-text-muted">
                                            {m.telephone ? (
                                                <span className="flex items-center gap-1"><Phone size={12} />{m.telephone}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-text-muted">{m.specialite || '-'}</td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(m)} className="p-2 rounded-lg text-text-muted hover:bg-primary/10 hover:text-primary transition-all">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg text-text-muted hover:bg-error/10 hover:text-error transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="glass w-full max-w-lg p-6 rounded-2xl shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-text">
                                    {editing ? 'Modifier le membre' : 'Ajouter un membre externe'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
                                    <X size={20} className="text-text-muted" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Prénom *</label>
                                        <input
                                            value={form.prenom}
                                            onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="Prénom"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Nom *</label>
                                        <input
                                            value={form.nom}
                                            onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="Nom"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Email</label>
                                    <input
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Affiliation</label>
                                    <input
                                        value={form.affiliation}
                                        onChange={e => setForm(f => ({ ...f, affiliation: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Organisation / Université"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Téléphone</label>
                                        <input
                                            value={form.telephone}
                                            onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="+212 6XX XXX XXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Spécialité</label>
                                        <input
                                            value={form.specialite}
                                            onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="Spécialité"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-8">
                                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-surface-hover transition-all">
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !form.nom || !form.prenom}
                                    className="primary action-btn flex items-center gap-2 px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    {editing ? 'Enregistrer' : 'Ajouter'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MembresExternesPage;
