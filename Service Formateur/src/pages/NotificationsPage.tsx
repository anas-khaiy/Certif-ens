import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bell, 
    Clock, 
    BookOpen, 
    PlayCircle, 
    AlertCircle, 
    ChevronRight,
    Calendar,
    ArrowLeft,
    Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useReminders } from '../hooks/useReminders';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { reminders, loading } = useReminders();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 bg-surface border border-glass-border rounded-xl hover:bg-surface-hover transition-all text-text-muted"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-4xl font-black text-text tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Bell size={28} />
                            </div>
                            Centre de Notifications
                        </h2>
                    </div>
                    <p className="text-text-muted ml-14 font-medium">Suivez vos échéances et rappels d'apprentissage importants.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-text-muted font-bold">Analyse de vos rappels...</p>
                </div>
            ) : reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-surface border border-glass-border rounded-[3rem] text-center shadow-xl">
                    <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
                        <Bell size={48} className="opacity-40" />
                    </div>
                    <h3 className="text-2xl font-black text-text mb-2">Tout est à jour !</h3>
                    <p className="text-text-muted max-w-md mx-auto font-medium px-4">
                        Vous n'avez aucune notification urgente pour le moment. Votre progression est exemplaire !
                    </p>
                    <button 
                        onClick={() => navigate('/bundle-catalog')}
                        className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/25"
                    >
                        Parcourir les parcours
                    </button>
                </div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-6"
                >
                    {reminders.map((reminder) => (
                        <motion.div
                            key={reminder.key}
                            variants={itemVariants}
                            whileHover={{ scale: 1.01, x: 5 }}
                            className={`group glass overflow-hidden border transition-all shadow-lg hover:shadow-xl ${
                                reminder.type === 'deadline' 
                                ? (reminder.daysRemaining! <= 0 ? 'border-error/40 hover:border-error/60 bg-error/5' : 'border-orange-500/30 hover:border-orange-500/50') 
                                : 'border-primary/30 hover:border-primary/50'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row items-stretch md:items-center p-6 gap-6">
                                {/* Type Icon */}
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                                    reminder.type === 'deadline' 
                                    ? (reminder.daysRemaining! <= 0 ? 'bg-error/10 text-error' : 'bg-orange-500/10 text-orange-500') 
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                    {reminder.type === 'deadline' ? (reminder.daysRemaining! <= 0 ? <AlertCircle size={32} /> : <Clock size={32} />) : <AlertCircle size={32} />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={14} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase text-text-muted tracking-widest italic">Rappel de cours</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">{reminder.title}</h3>
                                    
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        {reminder.type === 'deadline' ? (
                                            reminder.daysRemaining! <= 0 ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-error/10 text-error text-xs font-black border border-error/20 animate-pulse">
                                                    <AlertCircle size={14} />
                                                    COURS EXPIRÉ
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-black border border-orange-500/20">
                                                    <Clock size={14} />
                                                    EXPIRE DANS {reminder.daysRemaining} JOURS
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-black border border-primary/20 uppercase">
                                                <Clock size={14} />
                                                À CONTINUER
                                            </div>
                                        )}
                                        
                                        {reminder.deadline && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-hover text-text-muted text-xs font-bold border border-glass-border">
                                                <Calendar size={14} />
                                                Limite: {reminder.deadline}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => navigate(`/courses/${reminder.id}/preview`)}
                                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95 whitespace-nowrap ${
                                            reminder.type === 'deadline'
                                            ? (reminder.daysRemaining! <= 0 ? 'bg-error text-white shadow-error/30 hover:bg-error-hover' : 'bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600')
                                            : 'bg-primary text-white shadow-primary/30 hover:bg-primary-hover'
                                        }`}
                                    >
                                        <PlayCircle size={20} />
                                        {reminder.daysRemaining! <= 0 ? 'Détails du cours' : 'Reprendre le cours'}
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Notification Settings Hint */}
            <div className="glass p-8 bg-surface-hover/30 border-glass-border rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                    <Settings size={32} />
                </div>
                <div>
                    <h4 className="text-xl font-bold mb-1">Comment sont calculés ces rappels ?</h4>
                    <p className="text-text-muted text-sm font-medium">
                        Ces alertes se basent sur les paramètres de rappel définis par vos formateurs pour chaque cours. 
                        Si un cours a une date limite, nous vous prévenons quelques jours avant pour vous aider à réussir votre certification.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
