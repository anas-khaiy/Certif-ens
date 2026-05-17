import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import Editor from '@monaco-editor/react';
import { 
    Play, 
    Terminal, 
    Download, 
    Cpu, 
    ChevronDown, 
    Code, 
    RefreshCcw,
    AlertTriangle,
    CheckCircle2,
    FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

const LANGUAGES = [
    { id: 'python', name: 'Python 3', monaco: 'python', judgeId: 71, ext: 'py', version: '3.12.0', default: 'print("Bonjour le monde Informatique !")' },
    { id: 'javascript', name: 'JavaScript', monaco: 'javascript', judgeId: 93, ext: 'js', version: '20.12.0', default: 'console.log("Bonjour le monde Informatique !");' },
    { id: 'typescript', name: 'TypeScript', monaco: 'typescript', judgeId: 94, ext: 'ts', version: '5.4.3', default: 'const message: string = "Bonjour le monde Informatique !";\nconsole.log(message);' },
    { id: 'java', name: 'Java', monaco: 'java', judgeId: 91, ext: 'java', version: '17.0.2', default: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Bonjour le monde Informatique !");\n    }\n}' },
    { id: 'cpp', name: 'C++', monaco: 'cpp', judgeId: 105, ext: 'cpp', version: 'GCC 13.2.0', default: '#include <iostream>\n\nint main() {\n    std::cout << "Bonjour le monde Informatique !" << std::endl;\n    return 0;\n}' },
    { id: 'c', name: 'C', monaco: 'c', judgeId: 75, ext: 'c', version: 'GCC 13.1.0', default: '#include <stdio.h>\n\nint main() {\n    printf("Bonjour le monde Informatique !\\n");\n    return 0;\n}' },
    { id: 'php', name: 'PHP', monaco: 'php', judgeId: 98, ext: 'php', version: '8.3.4', default: '<?php\n\necho "Bonjour le monde Informatique !";' },
    { id: 'go', name: 'Go', monaco: 'go', judgeId: 95, ext: 'go', version: '1.22.2', default: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Bonjour le monde Informatique !")\n}' },
    { id: 'rust', name: 'Rust', monaco: 'rust', judgeId: 73, ext: 'rs', version: '1.77.2', default: 'fn main() {\n    println!("Bonjour le monde Informatique !");\n}' },
    { id: 'ruby', name: 'Ruby', monaco: 'ruby', judgeId: 72, ext: 'rb', version: '3.3.0', default: 'puts "Bonjour le monde Informatique !"' },
    { id: 'swift', name: 'Swift', monaco: 'swift', judgeId: 83, ext: 'swift', version: '5.10', default: 'print("Bonjour le monde Informatique !")' }
];

const CodeEditorPage = () => {
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(selectedLang.default);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [lastCorrection, setLastCorrection] = useState<Date | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const stompClientRef = useRef<Client | null>(null);
    const codeRef = useRef(code);
    const langRef = useRef(selectedLang);

    // Keep refs in sync with state
    useEffect(() => {
        codeRef.current = code;
        langRef.current = selectedLang;
    }, [code, selectedLang]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Authorization check: only specialty 'Informatique' (case insensitive match)
        const specObj = userData.specialite;
        const specName = typeof specObj === 'object' ? specObj.nom : (specObj || '');
        const isInfo = specName.toLowerCase().includes('informatique');
        setIsAuthorized(isInfo);
        
        let presenceInterval: any;

        // Force a stable ID across the session to prevent multiple ghost learners
        let fallbackId = sessionStorage.getItem('certiflow_fallback_id');
        if (!fallbackId) {
            fallbackId = Math.floor(Math.random() * 10000).toString();
            sessionStorage.setItem('certiflow_fallback_id', fallbackId);
        }
        
        const actualId = userData.id || parseInt(fallbackId);
        
        if (!userData.id) {
            console.warn("WARNING: userData.id is missing! Using persistent fallback ID:", actualId);
        }

        // Initialize STOMP for Realtime Code Sync if authorized
        if (isInfo) {
            const client = new Client({
                brokerURL: WS_APPRENANT,
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                onConnect: () => {
                    console.log('Connected to CodeSync STOMP server');
                    // Send initial code on connect
                    console.log('Publishing initial code and presence to /app/course/global/presence and code');
                    client.publish({
                        destination: '/app/course/global/presence',
                        body: JSON.stringify({
                            learnerId: actualId,
                            name: (userData.prenom || '') + ' ' + (userData.nom || ''),
                            code: codeRef.current, // Use Ref to avoid stale closure
                            language: langRef.current.monaco,
                            online: true
                        })
                    });

                    client.publish({
                        destination: '/app/course/global/code',
                        body: JSON.stringify({
                            learnerId: actualId,
                            name: (userData.prenom || '') + ' ' + (userData.nom || ''),
                            code: codeRef.current, // Use Ref to avoid stale closure
                            language: langRef.current.monaco
                        })
                    });

                    // Subscribe to corrections from formateur
                    client.subscribe(`/topic/course/global/correction/${actualId}`, (message) => {
                        const data = JSON.parse(message.body);
                        if (data.code) {
                            setCode(data.code);
                            setLastCorrection(new Date());
                            // Also update the ref to prevent next sync from overwriting it immediately
                            codeRef.current = data.code;
                            console.log("Reçu une correction du formateur !");
                        }
                    });
                }
            });

            client.activate();
            stompClientRef.current = client;

            // Send presence heartbeat every 10 seconds
            presenceInterval = setInterval(() => {
                if (client.active && client.connected) {
                    client.publish({
                        destination: '/app/course/global/presence',
                        body: JSON.stringify({
                            learnerId: actualId,
                            name: (userData.prenom || '') + ' ' + (userData.nom || ''),
                            code: codeRef.current, // Use Ref to avoid stale closure
                            language: langRef.current.monaco,
                            online: true
                        })
                    });
                }
            }, 10000);
        }

        return () => {
            if (presenceInterval) clearInterval(presenceInterval);
            if (stompClientRef.current) {
                const client = stompClientRef.current;
                if (client.active) {
                    if (client.connected) {
                        try {
                            client.publish({
                                destination: '/app/course/global/presence',
                                body: JSON.stringify({
                                    learnerId: actualId,
                                    online: false
                                })
                            });
                        } catch (e) {
                            console.warn("Could not send offline status", e);
                        }
                    }
                    client.deactivate();
                }
                stompClientRef.current = null;
            }
        };
    }, []); // Run ONCE on mount! No longer reconnects on language change.

    const handleCodeChange = (value: string | undefined) => {
        const newCode = value || '';
        setCode(newCode);

        if (stompClientRef.current && stompClientRef.current.active && stompClientRef.current.connected) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const fallbackId = sessionStorage.getItem('certiflow_fallback_id') || Math.floor(Math.random() * 10000).toString();
            const actualId = userData.id || parseInt(fallbackId);
            
            stompClientRef.current.publish({
                destination: '/app/course/global/code',
                body: JSON.stringify({
                    learnerId: actualId,
                    name: (userData.prenom || '') + ' ' + (userData.nom || ''),
                    code: newCode,
                    language: langRef.current.monaco
                })
            });
        }
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('Exécution en cours...');
        
        try {
            const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language_id: selectedLang.judgeId,
                    source_code: code
                })
            });
            
            const data = await response.json();
            
            if (data.status && data.status.id === 3) { // Accepted
                setOutput(data.stdout || 'Exécution terminée avec succès (pas de sortie).');
            } else if (data.stderr || data.compile_output) {
                setOutput((data.stderr || '') + (data.compile_output || ''));
            } else if (data.message) {
                setOutput(`Erreur Judge0: ${data.message}`);
            } else {
                setOutput(`Erreur : ${data.status?.description || 'Erreur inconnue'}`);
            }
        } catch (error) {
            setOutput('Impossible de contacter le serveur d\'exécution Judge0.');
            console.error(error);
        } finally {
            setIsRunning(false);
        }
    };

    const handleDownloadCode = () => {
        setIsSaving(true);
        try {
            // Create a blob with the code content
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary link and click it to trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `main.${selectedLang.ext}`;
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setLastSaved(new Date());
        } catch (error) {
            console.error("Error downloading code:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const changeLanguage = (lang: typeof LANGUAGES[0]) => {
        setSelectedLang(lang);
        setCode(lang.default);
        setIsLangMenuOpen(false);

        // Instantly notify trainer of the language change and new default code
        if (stompClientRef.current && stompClientRef.current.active && stompClientRef.current.connected) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const fallbackId = sessionStorage.getItem('certiflow_fallback_id') || Math.floor(Math.random() * 10000).toString();
            const actualId = userData.id || parseInt(fallbackId);
            stompClientRef.current.publish({
                destination: '/app/course/global/code',
                body: JSON.stringify({
                    learnerId: actualId, // Use the same generated ID or actual ID
                    name: (userData.prenom || '') + ' ' + (userData.nom || ''),
                    code: lang.default,
                    language: lang.monaco
                })
            });
        }
    };

    if (isAuthorized === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center text-error mb-6 shadow-2xl shadow-error/20 border border-error/20">
                    <AlertTriangle size={48} />
                </div>
                <h1 className="text-3xl font-black mb-4">Accès Réservé</h1>
                <p className="max-w-md text-text-muted font-medium text-lg">
                    Désolé, l'Éditeur CertiFlow est exclusivement réservé aux apprenants de la spécialité <span className="text-primary font-bold">Informatique</span>.
                </p>
                <div className="mt-8 flex gap-4">
                    <button onClick={() => window.history.back()} className="px-8 py-3 glass hover:bg-surface-hover rounded-xl font-bold transition-all">Retour</button>
                    <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">Tableau de bord</button>
                </div>
            </div>
        );
    }

    if (isAuthorized === null) return null;

    return (
        <div className="min-h-[calc(100vh-160px)] lg:h-[calc(100vh-160px)] flex flex-col gap-6 animate-fade-in pb-4">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface/50 backdrop-blur-md p-6 rounded-3xl border border-glass-border relative z-20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                        <Code size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Espace <span className="text-primary font-black uppercase">Coding</span> Expert</h1>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                             Env de Test : <span className="text-success flex items-center gap-1"><Cpu size={12} /> Sandbox Isolée</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <button 
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="flex items-center gap-3 px-5 py-3 glass hover:bg-surface-hover rounded-2xl transition-all border border-glass-border font-bold text-sm min-w-[160px] justify-between group"
                        >
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> {selectedLang.name}</span>
                            <ChevronDown size={18} className={`transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                            {isLangMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-surface border border-glass-border rounded-2xl shadow-2xl z-[1000] overflow-hidden backdrop-blur-xl"
                                >
                                    {LANGUAGES.map(lang => (
                                        <button 
                                            key={lang.id}
                                            onClick={() => changeLanguage(lang)}
                                            className={`w-full text-left px-5 py-3 hover:bg-primary/10 hover:text-primary transition-all text-sm font-bold border-b border-glass-border/10 last:border-0 ${selectedLang.id === lang.id ? 'bg-primary/5 text-primary' : ''}`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button 
                        onClick={handleDownloadCode}
                        disabled={isSaving}
                        className="p-3 glass hover:bg-primary/10 hover:text-primary hover:border-primary/30 rounded-2xl transition-all border border-glass-border group relative"
                        title="Télécharger le fichier"
                    >
                        {isSaving ? <RefreshCcw size={20} className="animate-spin" /> : <Download size={20} />}
                        {lastSaved && !isSaving && (
                            <div className="absolute -top-1 -right-1">
                                <CheckCircle2 size={12} className="text-success bg-background rounded-full" />
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
                    >
                        {isRunning ? (
                            <RefreshCcw size={20} className="animate-spin" />
                        ) : (
                            <Play size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        )}
                        EXÉCUTER
                    </button>
                </div>
            </header>

            {/* Correction Notification */}
            <AnimatePresence>
                {lastCorrection && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: -24 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: -24 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-[1.5rem] flex items-center justify-between shadow-lg shadow-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                    <CheckCircle2 size={28} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-black text-sm md:text-base uppercase tracking-tight text-primary">Le formateur a apporté une correction</p>
                                    <p className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                        <RefreshCcw size={10} /> Reçu le {lastCorrection.toLocaleString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setLastCorrection(null)}
                                className="px-5 py-2 glass hover:bg-surface-hover rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text transition-all"
                            >
                                Masquer
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Editor and Console Section */}
            <div className="flex flex-1 flex-col lg:flex-row gap-6 min-h-0">
                {/* Editor Container */}
                <div className="flex-[3] min-h-[500px] lg:min-h-0 bg-[#1e1e1e] rounded-[2.5rem] overflow-hidden border border-glass-border shadow-2xl relative">
                    <div className="absolute top-6 left-6 right-6 h-8 flex items-center justify-between z-10 pointer-events-none opacity-40">
                        <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500/50" />
                             <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                             <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{selectedLang.monaco} - {selectedLang.version}</span>
                    </div>
                    <Editor
                        height={window.innerWidth < 1024 ? "500px" : "100%"}
                        loading={<div className="flex items-center justify-center h-full text-white/50 font-bold uppercase tracking-widest text-xs">Initialisation de l-editeur...</div>}
                        language={selectedLang.monaco}
                        theme="vs-dark"
                        value={code}
                        onChange={handleCodeChange}
                        options={{
                            minimap: { enabled: false },
                            lineNumbers: "on",
                            glyphMargin: true,
                            fontSize: 15,
                            fontFamily: "'Fira Code', 'Monaco', 'Cascadia Code', monospace",
                            fontLigatures: true,
                            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                            padding: { top: 20, bottom: 20 },
                            roundedSelection: true,
                            cursorSmoothCaretAnimation: 'on',
                            smoothScrolling: true,
                            lineNumbersMinChars: 3,
                            folding: true,
                            automaticLayout: true
                        }}
                    />
                </div>

                {/* Terminal Section */}
                <div className="flex-1 flex flex-col gap-4 bg-surface border border-glass-border rounded-[2.5rem] p-6 shadow-xl min-h-[300px] lg:min-h-0">
                    <div className="flex items-center justify-between border-b border-glass-border pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-success/10 text-success rounded-xl">
                                <Terminal size={18} />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-wider">Console de sortie</h3>
                        </div>
                        <button 
                            onClick={() => setOutput('')}
                            className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-all"
                        >
                            <RefreshCcw size={16} />
                        </button>
                    </div>

                    <div className="flex-1 bg-background/50 rounded-2xl p-4 font-mono text-sm overflow-y-auto custom-scrollbar relative group">
                        {!output && !isRunning ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3 opacity-30">
                                <div className="w-12 h-12 rounded-full border border-dashed border-text-muted" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">En attente d'exécution</span>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap break-all leading-relaxed text-text">
                                {output}
                            </pre>
                        )}
                        
                    </div>

                    <div className="pt-2 px-2 flex items-center justify-between">
                        {lastSaved && (
                            <span className="text-[10px] font-bold text-text-muted italic flex items-center gap-1">
                                <RefreshCcw size={10} /> Enregistré à {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest ml-auto flex items-center gap-1">
                            <FileCode size={12} /> Prêt pour téléchargement
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditorPage;
