import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Bell, 
    Clock, 
    ArrowRight, 
    X, 
    AlertCircle, 
    BookOpen,
    PlayCircle
} from 'lucide-react';
import { useReminders } from '../../hooks/useReminders';

const ReminderOverlay: React.FC = () => {
    const navigate = useNavigate();
    const { reminders } = useReminders();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Auto-show logic
        if (reminders.length > 0 && !sessionStorage.getItem('reminder_shown')) {
            setShow(true);
            sessionStorage.setItem('reminder_shown', 'true');
        }
    }, [reminders]);

    if (!show || reminders.length === 0) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={() => setShow(false)}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-xl bg-surface border border-glass-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <Bell className="animate-bounce" size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-text">Rappels d'apprentissage</h3>
                                <p className="text-text-muted font-medium">Ne laissez pas vos objectifs s'échapper !</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShow(false)}
                            className="p-2 hover:bg-surface-hover rounded-full transition-all text-text-muted"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Reminders List */}
                    <div className="p-8 pt-2 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                        {reminders.map((reminder) => {
                            const isExpired = reminder.type === 'deadline' && (reminder.daysRemaining || 0) <= 0;
                            
                            return (
                                <motion.div
                                    key={reminder.id}
                                    whileHover={{ x: 5 }}
                                    className={`group p-5 border rounded-3xl transition-all flex items-center justify-between gap-4 ${
                                        isExpired 
                                        ? 'bg-error/5 border-error/20 hover:border-error/40' 
                                        : 'bg-surface-hover/50 border-glass-border hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <BookOpen size={14} className={reminder.type === 'alert' ? 'text-error' : 'text-primary'} />
                                            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">
                                                {reminder.type === 'alert' ? 'Tâche Supervisée' : 'Cours en cours'}
                                            </span>
                                        </div>
                                        <h4 className={`font-bold transition-colors ${reminder.type === 'alert' ? 'text-error' : 'text-text group-hover:text-primary'}`}>{reminder.title}</h4>
                                        
                                        <div className="flex items-center gap-3 mt-3">
                                            {reminder.type === 'alert' ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-black border border-error/20">
                                                    <AlertCircle size={12} />
                                                    ALERTE TÂCHE
                                                </div>
                                            ) : reminder.type === 'deadline' ? (
                                                isExpired ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-black border border-error/20 animate-pulse">
                                                        <AlertCircle size={12} />
                                                        EXPIRÉ
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black border border-orange-500/20">
                                                        <Clock size={12} />
                                                        EXPIRE DANS {reminder.daysRemaining} JOURS
                                                    </div>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20 uppercase">
                                                    <AlertCircle size={12} />
                                                    À continuer
                                                </div>
                                            )}
                                            {reminder.deadline && (
                                                <span className="text-[10px] font-bold text-text-muted italic">Limite: {reminder.deadline}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            if (reminder.type === 'alert') {
                                                navigate('/encadrement');
                                            } else {
                                                navigate(`/courses/${reminder.id}/preview`);
                                            }
                                            setShow(false);
                                        }}
                                        className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all ${
                                            isExpired ? 'bg-error shadow-error/30' : 'bg-primary shadow-primary/30'
                                        }`}
                                    >
                                        <PlayCircle size={22} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-surface-hover/30 border-t border-glass-border flex gap-4">
                        <button
                            onClick={() => setShow(false)}
                            className="flex-1 py-4 px-6 rounded-2xl bg-surface border border-glass-border font-bold text-text-muted hover:bg-surface-hover transition-all"
                        >
                            Plus tard
                        </button>
                        <button
                            onClick={() => {
                                navigate('/enrolled-courses');
                                setShow(false);
                            }}
                            className="flex-[2] py-4 px-6 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
                        >
                            Voir tous mes cours
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReminderOverlay;
