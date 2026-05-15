import { useState, useEffect, useRef } from 'react';
import { 
    LiveKitRoom, 
    VideoConference, 
} from '@livekit/components-react';
import '@livekit/components-styles';
import { LogIn, Users, AlertCircle } from 'lucide-react';
import { API_FORMATEUR, WS_LIVEKIT } from '../config';

const serverUrl = WS_LIVEKIT;
const POLL_INTERVAL_MS = 4000; // check every 4 seconds

const LiveClassPage = () => {
    const [token, setToken] = useState<string | null>(null);
    const [roomName, setRoomName] = useState('Classe Virtuelle');
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kicked, setKicked] = useState(false); // formateur ended the session

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = (userData.prenom || '') + ' ' + (userData.nom || 'Apprenant');

    // Keep a ref to the current room name so the interval always reads the latest value
    const roomNameRef = useRef(roomName);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    // Start polling as soon as the apprenant joins the room
    useEffect(() => {
        if (!joined) return;

        roomNameRef.current = roomName;

        pollRef.current = setInterval(async () => {
            try {
                const cleanRoom = roomNameRef.current.replace(/\s+/g, '-');
                const resp = await fetch(
                    `${API_FORMATEUR}/livekit/status?room=${encodeURIComponent(cleanRoom)}`
                );
                if (!resp.ok) return; // network hiccup – keep waiting
                const data = await resp.json();
                if (!data.active) {
                    // Room was deleted by the formateur
                    stopPolling();
                    setJoined(false);
                    setToken(null);
                    setKicked(true);
                }
            } catch {
                // Ignore transient errors
            }
        }, POLL_INTERVAL_MS);

        return () => stopPolling();
    }, [joined]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleJoin = async () => {
        setError(null);
        setKicked(false);
        try {
            const cleanRoom = roomName.replace(/\s+/g, '-');
            const randomId = Math.random().toString(36).substring(7);
            const identity = `Apprenant-${userName.replace(/\s+/g, '-')}-${randomId}`;
            const resp = await fetch(
                `${API_FORMATEUR}/livekit/token?room=${encodeURIComponent(cleanRoom)}&identity=${encodeURIComponent(identity)}&canPublish=true`
            );
            const data = await resp.json();
            if (!resp.ok) {
                setError(data.error || `Erreur ${resp.status}`);
                return;
            }
            setToken(data.token);
            setJoined(true);
        } catch (e) {
            console.error(e);
            setError("Impossible de rejoindre la classe. Veuillez réessayer.");
        }
    };

    if (!joined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-8 px-4 gap-6 md:gap-8 animate-fade-in">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-success/10 flex items-center justify-center text-success shadow-2xl shadow-success/20 border border-success/20">
                    <Users className="w-8 h-8 md:w-12 md:h-12" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase px-2">Rejoindre le <span className="text-success italic">Direct</span></h1>
                    <p className="text-text-muted font-bold text-sm md:text-lg max-w-[280px] md:max-w-none mx-auto">Connectez-vous à la classe virtuelle de votre professeur</p>
                </div>

                {/* ── Session ended banner ───────────────────────────────── */}
                {kicked && (
                    <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 font-bold text-sm max-w-sm w-full animate-fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>Le formateur a mis fin à la session. La classe est terminée.</span>
                    </div>
                )}

                <div className="w-full max-w-sm md:max-w-md space-y-6 px-2">
                    <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-muted ml-2">Code de la salle</label>
                        <input 
                            type="text" 
                            className="w-full px-5 py-4 md:px-6 md:py-4 glass rounded-[1.2rem] md:rounded-2xl border border-glass-border font-bold text-base md:text-lg focus:border-success/50 transition-all outline-none"
                            placeholder="Nom de la salle"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleJoin}
                        className="w-full py-4 md:py-5 bg-success text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-xl shadow-2xl shadow-success/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <LogIn className="w-5 h-5 md:w-6 md:h-6" />
                        REJOINDRE LA CLASSE
                    </button>

                    {error && (
                        <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-[10px] font-bold uppercase tracking-widest text-center animate-shake">
                            {error}
                        </div>
                    )}
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
                onDisconnected={() => {
                    stopPolling();
                    setJoined(false);
                    setToken(null);
                }}
                onError={(e) => {
                    console.error(e);
                    stopPolling();
                    setJoined(false);
                    setToken(null);
                    setError("Le direct n'a pas encore été lancé par le professeur ou la salle est fermée.");
                }}
                data-lk-theme="default"
                style={{ height: '100%', width: '100%' }}
            >
                <VideoConference />
            </LiveKitRoom>
        </div>
    );
};

export default LiveClassPage;
