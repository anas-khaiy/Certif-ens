import React, { useState, useRef, useEffect } from 'react';
import { Printer, PenTool, RotateCcw, Check, User, Upload } from 'lucide-react';

interface CertificateData {
    recipientName: string;
    courseName: string;
    issueDate: string;
    instructorName: string;
    instructorTitle: string;
    platformName: string;
    certificateId: string;
    score: number;
    completionRate: number;
    category: string;
}

const CertificateEditorPage = () => {
    // const [theme] = useState(() => localStorage.getItem('theme') || 'dark'); // Unused

    const [data, setData] = useState<CertificateData>({
        recipientName: 'Anas Khaiy',
        courseName: 'Développement Front-End moderne avec React',
        issueDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        instructorName: 'Mohamed LACHGAR',
        instructorTitle: 'Instructeur Principal',
        platformName: 'MLIAEdu',
        certificateId: '28-049c5a51-a51c-4828-92c2-87cb31819ef',
        score: 87,
        completionRate: 100,
        category: 'PROGRAMMATION WEB'
    });

    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [stampImage, setStampImage] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Canvas for signature
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Initialize canvas - Run once on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Set internal resolution matching display size or fixed size
            canvas.width = 340;
            canvas.height = 120;

            const context = canvas.getContext('2d');
            if (context) {
                context.lineCap = 'round';
                context.strokeStyle = 'black';
                context.lineWidth = 2;
                contextRef.current = context;
            }
        }
    }, []);

    const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
        if (!canvasRef.current || !contextRef.current) return;

        const { clientX, clientY } = nativeEvent;
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }: React.MouseEvent) => {
        if (!isDrawing || !canvasRef.current || !contextRef.current) return;

        const { clientX, clientY } = nativeEvent;
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const clearSignature = () => {
        if (canvasRef.current && contextRef.current) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setSignatureImage(null);
    };

    const saveSignature = () => {
        if (canvasRef.current) {
            setSignatureImage(canvasRef.current.toDataURL());
            // Optionally close modal or drawing mode here
        }
    };

    const handlePrint = () => {
        window.print();
    };



    const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => setStampImage(e.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Auto-scale logic
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth - 64; // 32px padding on each side
                const certificateWidth = 1123; // A4 width in px at 96 DPI
                const newScale = Math.min(containerWidth / certificateWidth, 1);
                setScale(newScale);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background text-text">
            {/* Left Control Panel - No Print */}
            <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6 p-6 overflow-y-auto border-r border-glass-border no-print z-10 bg-surface">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold gradient-text">Éditeur</h1>
                    <button
                        onClick={handlePrint}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
                        title="Imprimer / Sauvegarder en PDF"
                    >
                        <Printer size={18} />
                        <span className="text-sm font-semibold">Imprimer</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Recipient Info */}
                    <section className="space-y-4">
                        <h2 className="text-sm uppercase tracking-wider text-text-muted font-bold flex items-center gap-2 border-b border-glass-border pb-2">
                            <User size={16} />
                            Informations
                        </h2>

                        <div className="grid gap-4">
                            <div className="form-group">
                                <label className="text-xs font-medium text-text-muted mb-1 block">Nom de l'étudiant</label>
                                <input
                                    type="text"
                                    value={data.recipientName}
                                    onChange={(e) => setData({ ...data, recipientName: e.target.value })}
                                    className="form-input h-9 text-sm"
                                />
                            </div>
                            <div className="form-group">
                                <label className="text-xs font-medium text-text-muted mb-1 block">Titre du Cours</label>
                                <input
                                    type="text"
                                    value={data.courseName}
                                    onChange={(e) => setData({ ...data, courseName: e.target.value })}
                                    className="form-input h-9 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-group">
                                    <label className="text-xs font-medium text-text-muted mb-1 block">Filière / Catégorie</label>
                                    <input
                                        type="text"
                                        value={data.category}
                                        onChange={(e) => setData({ ...data, category: e.target.value })}
                                        className="form-input h-9 text-sm"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-xs font-medium text-text-muted mb-1 block">Date</label>
                                    <input
                                        type="text"
                                        value={data.issueDate}
                                        onChange={(e) => setData({ ...data, issueDate: e.target.value })}
                                        className="form-input h-9 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-group">
                                    <label className="text-xs font-medium text-text-muted mb-1 block">Score (%)</label>
                                    <input
                                        type="number"
                                        value={data.score}
                                        onChange={(e) => setData({ ...data, score: Number(e.target.value) })}
                                        className="form-input h-9 text-sm"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="text-xs font-medium text-text-muted mb-1 block">ID Certificat</label>
                                    <input
                                        type="text"
                                        value={data.certificateId}
                                        onChange={(e) => setData({ ...data, certificateId: e.target.value })}
                                        className="form-input h-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Signature & Stamp */}
                    <section className="space-y-4">
                        <h2 className="text-sm uppercase tracking-wider text-text-muted font-bold flex items-center gap-2 border-b border-glass-border pb-2">
                            <PenTool size={16} />
                            Validation
                        </h2>

                        <div className="space-y-4">
                            {/* Signature Canvas */}
                            <div>
                                <label className="text-xs font-medium text-text-muted mb-2 block">Signature Instructeur</label>
                                {!signatureImage ? (
                                    <div className="border border-dashed border-glass-border rounded-lg bg-surface-hover/50 p-2 text-center">
                                        <canvas
                                            ref={canvasRef}
                                            onMouseDown={startDrawing}
                                            onMouseUp={finishDrawing}
                                            onMouseMove={draw}
                                            onMouseLeave={finishDrawing}
                                            className="bg-white rounded border border-gray-200 cursor-crosshair mx-auto touch-none w-full"
                                            width={340}
                                            height={120}
                                        />
                                        <div className="flex justify-center gap-2 mt-2">
                                            <button
                                                onClick={clearSignature}
                                                className="text-xs px-2 py-1 bg-surface border border-glass-border rounded hover:bg-surface-hover transition-colors"
                                            >
                                                Effacer
                                            </button>
                                            <button
                                                onClick={saveSignature}
                                                className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-hover transition-colors flex items-center gap-1"
                                            >
                                                <Check size={10} /> Valider
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group border border-glass-border rounded-lg p-2 bg-white">
                                        <img src={signatureImage} alt="Signature" className="h-12 object-contain mx-auto" />
                                        <button
                                            onClick={() => setSignatureImage(null)}
                                            className="absolute top-1 right-1 p-1 bg-error text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <RotateCcw size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Stamp Upload */}
                            <div>
                                <label className="text-xs font-medium text-text-muted mb-2 block">Cachet Établissement</label>
                                <label className="flex flex-col items-center justify-center h-20 border border-dashed border-glass-border rounded-lg cursor-pointer hover:bg-surface-hover/50 transition-colors bg-surface relative overflow-hidden">
                                    {stampImage ? (
                                        <div className="group w-full h-full flex items-center justify-center">
                                            <img src={stampImage} alt="Cachet" className="h-16 object-contain" />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-medium flex items-center gap-1">
                                                    <Upload size={12} /> Changer
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-text-muted">
                                            <Upload className="w-5 h-5 mb-1" />
                                            <span className="text-[10px]">PNG Transparent</span>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleStampUpload} />
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Right Preview Panel - Printable Area */}
            <div className="flex-1 bg-gray-200/50 dark:bg-black/20 flex flex-col overflow-hidden relative">
                {/* Toolbar */}
                <div className="h-12 border-b border-glass-border bg-surface flex items-center justify-between px-4 no-print flex-shrink-0">
                    <span className="text-xs font-medium text-text-muted">Aperçu en temps réel</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{Math.round(scale * 100)}%</span>
                    </div>
                </div>

                {/* Scrollable Container */}
                <div className="flex-1 overflow-auto p-8 flex items-center justify-center" ref={containerRef}>
                    {/* Centered Scaled Content */}
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                            width: '1123px', // Fixed A4 Width
                            height: '794px', // Fixed A4 Height
                            boxShadow: '0 0 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        className="flex-shrink-0 transition-transform duration-200 ease-out"
                    >
                        {/* Certificate Content */}
                        <div id="certificate-preview" className="bg-white text-slate-800 w-full h-full relative overflow-hidden flex flex-col p-[40px] select-none">

                            {/* Border Decoration */}
                            <div className="absolute inset-4 border-[6px] border-slate-800 pointer-events-none z-10"></div>

                            {/* Content */}
                            <div className="relative z-20 flex flex-col h-full items-center text-center justify-between py-8 px-12">

                                {/* Header */}
                                <div className="w-full flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-700 text-white flex items-center justify-center font-bold text-xl rounded shadow-sm">M</div>
                                        <div className="text-left">
                                            <h2 className="font-bold text-slate-900 text-xl tracking-tight leading-none">{data.platformName}</h2>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Plateforme de Certification Professionnelle</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">Certification Reference ID</p>
                                        <p className="text-xs font-mono text-slate-600 font-bold">{data.certificateId}</p>
                                    </div>
                                </div>

                                {/* Title Section */}
                                <div className="mt-4">
                                    <h1 className="text-5xl font-serif font-bold text-slate-800 mb-4 tracking-tight">Certification Professionnelle</h1>
                                    <h2 className="text-3xl font-bold text-indigo-600 mb-8">{data.courseName}</h2>

                                    <p className="text-slate-500 font-medium text-lg mb-6">Nous certifions que</p>

                                    <h3 className="text-5xl font-serif font-bold text-slate-900 mb-6 italic">{data.recipientName}</h3>

                                    <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
                                        a complété avec succès toutes les exigences requises et a obtenu la certification professionnelle pour le cours <strong className="text-slate-800">{data.courseName}</strong>
                                    </p>
                                </div>

                                {/* Metrics */}
                                <div className="w-full flex justify-center gap-20 items-center mt-6 mb-6">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Catégorie</p>
                                        <p className="font-bold text-slate-800 text-lg">{data.category}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Score (Qualité)</p>
                                        <p className="font-bold text-slate-800 text-2xl">{data.score}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Progression</p>
                                        <p className="font-bold text-slate-800 text-2xl">{data.completionRate}%</p>
                                    </div>
                                </div>

                                {/* Footer / Signatures */}
                                <div className="w-full grid grid-cols-3 gap-8 items-end mt-auto pt-8 border-t border-slate-100">
                                    {/* Date */}
                                    <div className="text-left">
                                        <p className="text-slate-500 text-sm mb-1">{data.instructorTitle}</p>
                                        <p className="font-bold text-slate-800 text-lg">{data.instructorName}</p>
                                        <p className="text-slate-400 text-xs mt-2">Délivré le {data.issueDate}</p>
                                    </div>

                                    {/* Center Stamp */}
                                    <div className="flex justify-center -mt-6">
                                        {stampImage ? (
                                            <img src={stampImage} alt="Stamp" className="w-32 h-32 object-contain opacity-80 mix-blend-multiply rotate-[-10deg]" />
                                        ) : (
                                            <div className="w-28 h-28 border-4 border-slate-200 rounded-full flex items-center justify-center rotate-[-10deg] opacity-50">
                                                <span className="text-[10px] text-center font-bold text-slate-400 p-2 leading-tight uppercase">Cachet Officiel<br />{data.platformName}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Signature */}
                                    <div className="text-right flex flex-col items-end">
                                        <div className="h-16 flex items-end justify-end mb-2 relative w-48">
                                            {signatureImage ? (
                                                <img src={signatureImage} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                                            ) : (
                                                <div className="w-full border-b border-slate-300"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider border-t border-slate-300 pt-2 w-48 text-center">
                                            Signature Autorisée
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Badge */}
                            <div className="absolute top-12 right-12 w-24 h-24 bg-red-600 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-2xl rotate-12 z-30 print:shadow-none">
                                {data.score}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 0cm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #certificate-preview {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        z-index: 9999;
                        margin: 0;
                        padding: 0;
                        page-break-after: always;
                        transform: none !important;
                        box-shadow: none !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    /* Move the preview out of the scaled container for print */
                    body > *:not(#certificate-preview) {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default CertificateEditorPage;
