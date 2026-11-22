import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ImageLightboxProps {
    images: string[];
    index: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const STEP = 0.5;

/**
 * Visionneuse d'images plein écran : zoom avant / arrière, image précédente / suivante,
 * déplacement par glisser quand l'image est zoomée, raccourcis clavier (← → + - 0 Échap).
 */
const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, index, onIndexChange, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
    const hasMany = images.length > 1;

    const reset = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);

    const changeZoom = useCallback((delta: number) => {
        setZoom(z => {
            const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2)));
            if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
            return next;
        });
    }, []);

    const go = useCallback((dir: 1 | -1) => {
        if (images.length < 2) return;
        reset();
        onIndexChange((index + dir + images.length) % images.length);
    }, [images.length, index, onIndexChange, reset]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
            else if (e.key === '+' || e.key === '=') changeZoom(STEP);
            else if (e.key === '-') changeZoom(-STEP);
            else if (e.key === '0') reset();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go, changeZoom, reset, onClose]);

    if (!images[index]) return null;

    const btn = 'p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in select-none"
            onClick={onClose}
            onWheel={(e) => changeZoom(e.deltaY < 0 ? STEP / 2 : -STEP / 2)}
        >
            {/* Barre d'outils */}
            <div
                className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 border border-white/10 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <button className={btn} onClick={() => changeZoom(-STEP)} disabled={zoom <= MIN_ZOOM} title="Zoom arrière (-)"><ZoomOut size={20} /></button>
                <span className="text-white text-sm font-bold w-14 text-center">{Math.round(zoom * 100)}%</span>
                <button className={btn} onClick={() => changeZoom(STEP)} disabled={zoom >= MAX_ZOOM} title="Zoom avant (+)"><ZoomIn size={20} /></button>
                <button className={btn} onClick={reset} disabled={zoom === 1} title="Réinitialiser (0)"><RotateCcw size={20} /></button>
                {hasMany && <span className="text-white/80 text-sm font-semibold pl-2 pr-1">{index + 1} / {images.length}</span>}
            </div>

            <button
                className="absolute top-5 right-5 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-110 z-10"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                title="Fermer (Échap)"
            >
                <X size={26} />
            </button>

            {hasMany && (
                <>
                    <button className={`${btn} absolute left-5 top-1/2 -translate-y-1/2 z-10`} onClick={(e) => { e.stopPropagation(); go(-1); }} title="Image précédente (←)"><ChevronLeft size={30} /></button>
                    <button className={`${btn} absolute right-5 top-1/2 -translate-y-1/2 z-10`} onClick={(e) => { e.stopPropagation(); go(1); }} title="Image suivante (→)"><ChevronRight size={30} /></button>
                </>
            )}

            <img
                key={images[index]}
                src={images[index]}
                alt={`Image ${index + 1}`}
                draggable={false}
                className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transition: dragRef.current ? 'none' : 'transform 0.15s ease-out',
                    cursor: zoom > 1 ? 'grab' : 'zoom-in',
                }}
                onClick={(e) => { e.stopPropagation(); if (zoom === 1) changeZoom(STEP * 2); }}
                onPointerDown={(e) => {
                    if (zoom <= 1) return;
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
                }}
                onPointerMove={(e) => {
                    const d = dragRef.current;
                    if (!d) return;
                    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
                }}
                onPointerUp={() => { dragRef.current = null; }}
            />
        </div>,
        document.body
    );
};

export default ImageLightbox;
