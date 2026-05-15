import { useState, useEffect } from 'react';
import { 
    LiveKitRoom, 
    VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Video, Users, Share2, RefreshCw } from 'lucide-react';
import { API_FORMATEUR, WS_LIVEKIT } from '../config';

const serverUrl = WS_LIVEKIT;

const LiveClassroomPage = () => {
    const [token, setToken] = useState<string | null>(null);
    const [roomName, setRoomName] = useState('');
    const [inCall, setInCall] = useState(false);

    const generateCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setRoomName(`ROOM-${code}`);
    };

    useEffect(() => {
        generateCode();
    }, []);



    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const prenom = userData.prenom || 'Prof';
    const nom = userData.nom || 'Formateur';
    const userName = `${prenom} ${nom}`;

    const handleStartMeet = async () => {
        try {
            const token = localStorage.getItem('token');
            const cleanRoom = roomName.replace(/\s+/g, '-');
            const randomId = Math.random().toString(36).substring(7);
            const identity = `Formateur-${userName.replace(/\s+/g, '-')}-${randomId}`;
            
            const resp = await fetch(`${API_FORMATEUR}/livekit/token?room=${cleanRoom}&identity=${identity}&canPublish=true&createRoom=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!resp.ok) {
                const errorData = await resp.text();
                throw new Error(`Erreur ${resp.status}: ${errorData}`);
            }

            const data = await resp.json();
            setToken(data.token);
            setInCall(true);
        } catch (e) {
            console.error("Erreur d'initialisation de la classe:", e);
        }
    };

    if (!inCall) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-8 px-4 gap-6 md:gap-8 animate-fade-in">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-2xl shadow-primary/20 border border-primary/20">
                    <Video className="w-8 h-8 md:w-12 md:h-12" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase px-2">Classe <span className="text-primary italic">Virtuelle</span></h1>
                    <p className="text-text-muted font-bold text-sm md:text-lg max-w-[280px] md:max-w-none mx-auto">Lancez une session de vision-conférence avec vos apprenants</p>
                </div>

                <div className="w-full max-w-sm md:max-w-md space-y-6 px-2">
                    <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-muted ml-2">Code de la salle (Automatique ou Personnalisé)</label>
                        <div className="relative group">
                            <input 
                                type="text" 
                                className="w-full px-5 py-4 md:px-6 md:py-4 glass rounded-[1.2rem] md:rounded-2xl border border-glass-border font-black text-xl md:text-2xl text-primary tracking-widest outline-none focus:border-primary/50"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                            />
                            <button 
                                type="button"
                                onClick={generateCode}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-text-muted hover:text-primary z-10"
                                title="Générer un code aléatoire"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleStartMeet}
                        className="w-full py-4 md:py-5 bg-primary text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                        LANCER LE DIRECT
                    </button>
                </div>

                <div className="flex flex-wrap justify-center gap-3 md:gap-4 opacity-50">
                    <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface rounded-full border border-glass-border text-[10px] font-bold uppercase tracking-widest"><Video size={12} /> HD 1080p</div>
                    <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface rounded-full border border-glass-border text-[10px] font-bold uppercase tracking-widest"><Users size={12} /> Partage d'écran</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 9999,
            background: '#000',
        }}>
            <LiveKitRoom
                video={false}
                audio={false}
                token={token!}
                serverUrl={serverUrl}
                onDisconnected={async () => {
                    setInCall(false);
                    try {
                        const token = localStorage.getItem('token');
                        const cleanRoom = roomName.replace(/\s+/g, '-');
                        await fetch(`${API_FORMATEUR}/livekit/end?room=${cleanRoom}`, { 
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } catch (e) {
                        console.error("Failed to end room on backend", e);
                    }
                }}
                data-lk-theme="default"
                style={{ height: '100%', width: '100%' }}
            >
                <VideoConference />
            </LiveKitRoom>
        </div>
    );
};

export default LiveClassroomPage;
