import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import Editor from '@monaco-editor/react';
import { Code, Computer, EyeOff, Play, Terminal, RefreshCcw } from 'lucide-react';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface Apprenant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photoProfile: string;
}

interface OnlineLearner {
    learnerId: number;
    name: string;
    language: string;
    code: string;
    lastUpdate: Date;
    isOnline: boolean;
}

const LANGUAGES_MAP: Record<string, number> = {
    'python': 71,
    'javascript': 93,
    'typescript': 94,
    'java': 91,
    'cpp': 105,
    'c': 75,
    'php': 98,
    'go': 95,
    'rust': 73,
    'ruby': 72,
    'swift': 83
};

const LiveCodeTrackerPage = () => {
    // const [enrolledLearners, setEnrolledLearners] = useState<Apprenant[]>([]);
    const [onlineLearners, setOnlineLearners] = useState<Map<number, OnlineLearner>>(new Map());
    const [selectedLearnerId, setSelectedLearnerId] = useState<number | null>(null);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [localEdits, setLocalEdits] = useState<Map<number, string>>(new Map());
    const stompClientRef = useRef<Client | null>(null);

    const handleRunCode = async () => {
        const selectedData = selectedLearnerId ? onlineLearners.get(selectedLearnerId) : null;
        if (!selectedData || !selectedData.code) return;

        setIsRunning(true);
        setOutput('Exécution en cours...');
        
        try {
            const langKey = selectedData.language?.toLowerCase() || 'python';
            const judgeId = LANGUAGES_MAP[langKey] || 71;

            const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language_id: judgeId,
                    source_code: localEdits.get(selectedLearnerId!) !== undefined ? localEdits.get(selectedLearnerId!) : selectedData.code
                })
            });
            
            const data = await response.json();
            
            if (data.status && data.status.id === 3) {
                setOutput(data.stdout || 'Exécution terminée (pas de sortie).');
            } else if (data.stderr || data.compile_output) {
                setOutput((data.stderr || '') + (data.compile_output || ''));
            } else {
                setOutput(data.message || `Erreur: ${data.status?.description || 'Inconnue'}`);
            }
        } catch (error) {
            setOutput('Erreur lors de l\'exécution sur Judge0.');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSendCorrection = () => {
        if (!selectedLearnerId || !stompClientRef.current?.connected) return;
        
        const correctedCode = localEdits.get(selectedLearnerId) || onlineLearners.get(selectedLearnerId)?.code;
        if (!correctedCode) return;

        stompClientRef.current.publish({
            destination: `/app/course/global/correction/${selectedLearnerId}`,
            body: JSON.stringify({
                learnerId: selectedLearnerId,
                code: correctedCode,
                language: onlineLearners.get(selectedLearnerId)?.language
            })
        });
        
        // Clear local edits after sending so we revert to following the learner's live stream
        setLocalEdits(prev => {
            const next = new Map(prev);
            next.delete(selectedLearnerId);
            return next;
        });

        alert("Correction envoyée à l'apprenant !");
    };

    useEffect(() => {
        const fetchLearners = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const response = await axios.get(`${API_FORMATEUR}/enrollments/learners`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // setEnrolledLearners(response.data);
                
                // Once we have our enrolled learners, connect to CodeSync socket
                const allowedIds = new Set<number>(response.data.map((l: Apprenant) => Number(l.id)));
                console.log("✅ Apprenants autorisés (inscrits) :", Array.from(allowedIds));
                initializeStomp(allowedIds);
            } catch (error) {
                console.error("Error fetching learners", error);
            }
        };

        fetchLearners();

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, []);

    const initializeStomp = (allowedLearnerIds: Set<number>) => {
        const client = new Client({
            brokerURL: WS_APPRENANT,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log('Connected to CodeSync STOMP server');
            
            // Subscribe to presence
            client.subscribe('/topic/course/global/presence', (message) => {
                const data = JSON.parse(message.body);
                console.log('STOMP Presence Message received:', data);
                const lId = parseInt(data.learnerId);
                const isAllowed = allowedLearnerIds.has(lId);
                console.log(`📡 [PRESENCE] Apprenant ID ${lId} détecté. Autorisé ? ${isAllowed}`);
                
                if (isAllowed) {
                    setOnlineLearners(prev => {
                        const newMap = new Map(prev);
                        if (data.online) {
                            const existing = newMap.get(lId);
                            const detectedLang = data.language ? data.language.toLowerCase().replace(" 3", "").trim() : (existing?.language || 'python');
                            
                            newMap.set(lId, {
                                learnerId: lId,
                                name: data.name,
                                language: detectedLang,
                                code: data.code || existing?.code || '',
                                lastUpdate: new Date(),
                                isOnline: true
                            });
                        } else {
                            const existing = newMap.get(lId);
                            if (existing) {
                                newMap.set(lId, { ...existing, isOnline: false });
                            }
                        }
                        return newMap;
                    });
                }
            });

            // Subscribe to code updates
            client.subscribe('/topic/course/global/code', (message) => {
                const data = JSON.parse(message.body);
                console.log('STOMP Code Update received:', data);
                const lId = parseInt(data.learnerId);
                
                if (allowedLearnerIds.has(lId)) {
                    setOnlineLearners(prev => {
                        const existing = prev.get(lId);
                        const detectedLang = data.language ? data.language.toLowerCase().replace(" 3", "").trim() : 'python';
                        
                        // Force clear the trainer's local modifications if the learner just switched language
                        if (existing && existing.language && existing.language !== detectedLang) {
                            setTimeout(() => {
                                setLocalEdits(prevEdits => {
                                    const nextEdits = new Map(prevEdits);
                                    nextEdits.delete(lId);
                                    return nextEdits;
                                });
                            }, 0);
                        }

                        const newMap = new Map(prev);
                        const updated = existing || {
                            learnerId: lId,
                            name: data.name,
                            isOnline: true
                        } as OnlineLearner;
                        
                        updated.code = data.code;
                        updated.language = detectedLang;
                        updated.lastUpdate = new Date();
                        updated.isOnline = true; // They must be online if typing
                        
                        newMap.set(lId, updated);
                        return newMap;
                    });
                }
            });
        };

        client.activate();
        stompClientRef.current = client;
    };

    const selectedData = selectedLearnerId ? onlineLearners.get(selectedLearnerId) : null;

    const onlineList = Array.from(onlineLearners.values()).filter(l => l.isOnline);

    return (
        <div className="flex flex-col gap-4 md:gap-6 animate-fade-in h-[calc(100vh-120px)] md:h-[calc(100vh-140px)]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 md:p-6 rounded-2xl md:rounded-3xl border border-glass-border">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                        <Code size={20} className="md:w-[26px] md:h-[26px]" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight">Code Tracker</h1>
                        <p className="text-[10px] md:text-sm font-bold text-text-muted">Suivi en temps réel de l'avancement</p>
                    </div>
                </div>
                {selectedLearnerId && (
                    <button 
                        onClick={() => setSelectedLearnerId(null)}
                        className="px-4 py-2 bg-surface-hover rounded-xl text-xs font-black uppercase text-text-muted border border-glass-border flex items-center gap-2 hover:bg-white/5 transition-all"
                    >
                        <EyeOff size={14} /> Fermer le suivi
                    </button>
                )}
            </header>

            <div className="flex flex-col lg:flex-row flex-1 gap-4 md:gap-6 min-h-0">
                {/* List of valid learners */}
                <div className={`${selectedLearnerId ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 bg-surface rounded-[1.5rem] md:rounded-[2rem] border border-glass-border p-3 md:p-4 flex-col gap-4 overflow-hidden shadow-xl shrink-0`}>
                    <h3 className="font-black text-sm uppercase tracking-wider px-2">Apprenants En Ligne</h3>
                    
                    <div className="flex-1 overflow-y-auto px-1 custom-scrollbar flex flex-col gap-3">
                        {onlineList.length === 0 ? (
                            <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                                <Computer size={32} />
                                <span className="text-xs font-bold uppercase tracking-widest text-center">Aucun de vos<br/>apprenants en ligne</span>
                            </div>
                        ) : (
                            onlineList.map(learner => {
                                const isSelected = selectedLearnerId === learner.learnerId;
                                
                                return (
                                    <button
                                        key={learner.learnerId}
                                        onClick={() => setSelectedLearnerId(learner.learnerId)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${isSelected ? 'bg-primary/10 text-primary border-primary/30 shadow-lg' : 'bg-background hover:bg-surface-hover border-glass-border'}`}
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex justify-center items-center font-black text-primary">
                                                {learner.name ? learner.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-surface animate-pulse" />
                                        </div>
                                        <div className="flex flex-col items-start flex-1 overflow-hidden">
                                            <span className="font-bold text-sm truncate w-full text-left">{learner.name}</span>
                                            <span className="text-[10px] font-black uppercase text-text-muted">{learner.language}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Editor View */}
                <div className={`${selectedLearnerId ? 'flex' : 'hidden lg:flex'} flex-1 bg-[#1e1e1e] rounded-[1.5rem] md:rounded-[2.5rem] border border-glass-border overflow-hidden flex-col shadow-2xl relative`}>
                    {selectedData ? (
                        <div className="flex-1 flex flex-col h-full relative">
                            {/* Editor Header Overlay */}
                            <div className="absolute top-6 left-6 right-6 h-8 flex items-center justify-between z-10">
                                <div className="flex gap-2 opacity-40">
                                     <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                     <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                     <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30 hidden md:inline">
                                        {selectedData.name || 'APPRENANT'} - SYNCHRONISÉ ({onlineLearners.get(selectedLearnerId!)?.language?.toUpperCase() || 'CODE'})
                                    </span>
                                    <button 
                                        onClick={handleRunCode}
                                        disabled={isRunning}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 pointer-events-auto"
                                    >
                                        {isRunning ? (
                                            <RefreshCcw size={12} className="animate-spin" />
                                        ) : (
                                            <Play size={12} />
                                        )}
                                        EXÉCUTER
                                    </button>
                                    <button 
                                        onClick={handleSendCorrection}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-success text-white text-[10px] font-black rounded-lg shadow-lg shadow-success/20 hover:scale-105 active:scale-95 transition-all pointer-events-auto"
                                    >
                                        <RefreshCcw size={12} />
                                        ENVOYER CORRECTION
                                    </button>
                                </div>
                            </div>

                            {/* Main Content Area: Editor + Terminal */}
                            <div className="flex-1 flex flex-col min-h-0">
                                {/* Actual Editor Parent */}
                                <div className="flex-[2] min-h-0 w-full pt-16">
                                    <Editor
                                        height="100%"
                                        width="100%"
                                        language={selectedData.language || 'python'}
                                        theme="vs-dark"
                                        value={localEdits.get(selectedLearnerId!) !== undefined ? localEdits.get(selectedLearnerId!) : (selectedData.code || '')}
                                        onChange={(value) => {
                                            if (selectedLearnerId) {
                                                setLocalEdits(prev => new Map(prev).set(selectedLearnerId, value || ''));
                                            }
                                        }}
                                        options={{
                                            readOnly: false,
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            fontFamily: "'Fira Code', 'Monaco', 'Cascadia Code', monospace",
                                            fontLigatures: true,
                                            scrollbar: { 
                                                vertical: 'visible',
                                                horizontal: 'visible',
                                                verticalScrollbarSize: 6,
                                                horizontalScrollbarSize: 6
                                            },
                                            padding: { top: 20, bottom: 20 },
                                            roundedSelection: true,
                                            lineNumbersMinChars: 4,
                                            automaticLayout: true,
                                            wordWrap: 'on'
                                        }}
                                    />
                                </div>

                                {/* Console / Terminal Section */}
                                <div className="h-40 md:h-48 border-t border-white/5 bg-[#0d0d0d] flex flex-col">
                                    <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-white/5 bg-white/5 py-3">
                                        <div className="flex items-center gap-2">
                                            <Terminal size={12} className="text-primary" />
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50">Sortie Console</span>
                                        </div>
                                        {output && (
                                            <button 
                                                onClick={() => setOutput('')}
                                                className="text-[9px] md:text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest"
                                            >
                                                Effacer
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 p-3 md:p-4 font-mono text-[10px] md:text-xs overflow-y-auto custom-scrollbar">
                                        {!output && !isRunning ? (
                                            <span className="text-white/20 italic">En attente d'exécution...</span>
                                        ) : (
                                            <pre className="text-white/80 whitespace-pre-wrap">{output}</pre>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-6">
                            <EyeOff size={80} className="text-text-muted" />
                            <span className="text-xl font-black tracking-widest uppercase">Sélectionnez un apprenant</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveCodeTrackerPage;
