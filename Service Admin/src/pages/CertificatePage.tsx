import React, { useState, useRef, useEffect } from 'react';
import { Upload, PenTool, Award, QrCode, Image as ImageIcon, Printer, Save, Loader2 } from 'lucide-react';
import api from '../api/api-client';


const CertificatePage = () => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [prototypeId, setPrototypeId] = useState<number | null>(null);
    const [pendingFiles, setPendingFiles] = useState<{ [key: string]: File }>({});

    const [config, setConfig] = useState({
        logo: '',
        cachet: '',
        signature: '',
        tailleQR: '100',
        tailleLogo: '96',
        tailleCachet: '96',
        tailleSignature: '64',
        tailleMessage: '18',
        studentName: 'Jean Dupont',
        courseTitle: 'Développement Web Full Stack',
        trainerName: 'Marie Currie',
        date: new Date().toISOString().split('T')[0],
        score: '95',
        title: 'Certificat de Réussite \n',
        subtitle: 'Délivré à',
        message: 'Pour avoir complété avec succès la formation *{course}* et démontré les compétences requises avec un score de *{score}%*.'
    });

    useEffect(() => {
        const fetchPrototype = async () => {
            try {
                const response = await api.get('/prototypes');
                if (response.data && response.data.length > 0) {
                    const p = response.data[0];
                    setPrototypeId(p.id);
                    setConfig(prev => ({
                        ...prev,
                        ...p,
                        // Ensure numeric values are handled correctly if backend sends them as numbers
                        tailleQR: String(p.tailleQR || 100),
                        tailleLogo: String(p.tailleLogo || 96),
                        tailleCachet: String(p.tailleCachet || 96),
                        tailleSignature: String(p.tailleSignature || 64),
                        tailleMessage: String(p.tailleMessage || 18)
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch prototype", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrototype();
    }, []);

    const API_BASE_URL = 'http://localhost:8080/api/v1';

    // Helper to get full image URL
    const getImageUrl = (filename: string) => {
        if (!filename) return '';
        if (filename.startsWith('data:')) return filename; // Keep base64 if just uploaded but not saved
        return `${API_BASE_URL}/files/certificates/${filename}`;
    };

    const renderWithBold = (text: string) => {
        // Replace placeholders with dynamic values
        const dynamicText = text
            .replace(/{course}/g, config.courseTitle)
            .replace(/{score}/g, config.score);

        return dynamicText.split('*').map((part, index) =>
            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        );
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0];
        if (file) {
            // Local preview using FileReader
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, [key]: reader.result as string }));
                setPendingFiles(prev => ({ ...prev, [key]: file }));
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadFile = async (file: File, type: string) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/prototypes/upload/${type}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data; // filename returned by backend
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalConfig = { ...config };

            // 1. Upload pending files first
            const uploadTasks = Object.entries(pendingFiles).map(async ([key, file]) => {
                const endpointMap: Record<string, string> = {
                    logo: 'logo',
                    cachet: 'cachet',
                    signature: 'signature'
                };
                const filename = await uploadFile(file, endpointMap[key]);
                finalConfig[key as keyof typeof finalConfig] = filename;
            });

            await Promise.all(uploadTasks);

            // 2. Save the prototype configuration
            const payload = {
                ...finalConfig,
                message: finalConfig.message
            };

            if (prototypeId) {
                await api.put(`/prototypes/${prototypeId}`, payload);
            } else {
                const response = await api.post('/prototypes', payload);
                setPrototypeId(response.data.id);
            }

            // Clear pending files after successful save
            setPendingFiles({});
            alert("Configuration enregistrée avec succès !");
        } catch (error) {
            console.error("Save failed", error);
            alert("Erreur lors de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = () => {
        if (!certificateRef.current) return;

        const printContent = certificateRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=1200,height=800');

        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Imprimer le Certificat</title>
                        <style>
                            @page {
                                size: A4 landscape;
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                background-color: #ffffff !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            /* Force black text and white background for all elements */
                            .certificate-container {
                                width: 100%;
                                height: 100%;
                                position: relative;
                                overflow: hidden;
                                background-color: #ffffff !important;
                                color: #000000 !important;
                                display: flex !important;
                                flex-direction: column !important;
                                padding: 20mm !important;
                                box-sizing: border-box !important;
                            }
                            .certificate-container * {
                                color: #000000 !important;
                                border-color: #000000 !important;
                            }
                            /* Ensure specific flex behaviors are preserved if Tailwind doesn't load perfectly */
                            .header-section {
                                width: 100%;
                                display: flex !important;
                                justify-content: space-between !important;
                                align-items: flex-start !important;
                            }
                            .content-section {
                                flex: 1 !important;
                                display: flex !important;
                                flex-direction: column !important;
                                justify-content: center !important;
                                align-items: center !important;
                            }
                            .footer-section {
                                width: 100%;
                                display: flex !important;
                                justify-content: space-between !important;
                                align-items: flex-end !important;
                            }
                            
                            .certificate-title {
                                margin-top: -20mm !important;
                                margin-bottom: 20mm !important;
                            }
                            .certificate-date-wrapper {
                                margin-top: 50mm !important;
                            }
                            
                            /* Re-apply basic styles needed for print */
                             ${Array.from(document.styleSheets)
                    .map(styleSheet => {
                        try {
                            return Array.from(styleSheet.cssRules)
                                .map(rule => rule.cssText)
                                .join('');
                        } catch (e) {
                            console.log('Access to stylesheet denied', e);
                            return '';
                        }
                    })
                    .join('')}
                        </style>
                    </head>
                    <body>
                        <div class="certificate-container" style="width: 297mm; height: 210mm; position: relative; background-color: white;">
                            ${printContent}
                        </div>
                        <script>
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 1000);
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Personnalisation du Certificat
                    </h1>
                    <p className="text-text-muted mt-1">Personnalisez et prévisualisez vos certificats</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="primary flex items-center gap-2"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}
                </button>
            </div>

            {isLoading ? (
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="glass p-6 h-fit space-y-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-text">
                            <PenTool size={20} className="text-primary" />
                            Configuration
                        </h2>

                        {/* Logo Upload */}
                        <div className="form-group">
                            <label className="form-label flex items-center gap-2 text-text-muted">
                                <ImageIcon size={16} /> Logo de l'établissement
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'logo')}
                                    className="hidden"
                                    id="logo-upload"
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-glass-border rounded-xl cursor-pointer hover:bg-surface-hover transition-colors text-text-muted"
                                >
                                    <Upload size={18} />
                                    {config.logo ? 'Changer le logo' : 'Importer le logo'}
                                </label>
                            </div>
                            {config.logo && (
                                <div className="mt-2">
                                    <label className="text-xs text-text-muted mb-1 block">Taille du logo ({config.tailleLogo}px)</label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="200"
                                        value={config.tailleLogo}
                                        onChange={(e) => setConfig({ ...config, tailleLogo: e.target.value })}
                                        className="w-full h-1 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Stamp Upload */}
                        <div className="form-group">
                            <label className="form-label flex items-center gap-2 text-text-muted">
                                <Award size={16} /> Cachet de l'établissement
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'cachet')}
                                className="hidden"
                                id="stamp-upload"
                            />
                            <label
                                htmlFor="stamp-upload"
                                className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-glass-border rounded-xl cursor-pointer hover:bg-surface-hover transition-colors text-text-muted"
                            >
                                <Upload size={18} />
                                {config.cachet ? 'Changer le cachet' : 'Importer le cachet'}
                            </label>
                            {config.cachet && (
                                <div className="mt-2">
                                    <label className="text-xs text-text-muted mb-1 block">Taille du cachet ({config.tailleCachet}px)</label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="200"
                                        value={config.tailleCachet}
                                        onChange={(e) => setConfig({ ...config, tailleCachet: e.target.value })}
                                        className="w-full h-1 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Signature Upload */}
                        <div className="form-group">
                            <label className="form-label flex items-center gap-2 text-text-muted">
                                <PenTool size={16} /> Signature
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'signature')}
                                className="hidden"
                                id="signature-upload"
                            />
                            <label
                                htmlFor="signature-upload"
                                className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-glass-border rounded-xl cursor-pointer hover:bg-surface-hover transition-colors text-text-muted"
                            >
                                <Upload size={18} />
                                {config.signature ? 'Changer la signature' : 'Importer la signature'}
                            </label>
                            {config.signature && (
                                <div className="mt-2">
                                    <label className="text-xs text-text-muted mb-1 block">Taille de la signature ({config.tailleSignature}px)</label>
                                    <input
                                        type="range"
                                        min="40"
                                        max="200"
                                        value={config.tailleSignature}
                                        onChange={(e) => setConfig({ ...config, tailleSignature: e.target.value })}
                                        className="w-full h-1 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label flex items-center gap-2 text-text-muted">
                                <QrCode size={16} /> Taille du QR Code ({config.tailleQR}px)
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="200"
                                value={config.tailleQR}
                                onChange={(e) => setConfig({ ...config, tailleQR: e.target.value })}
                                className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label flex items-center gap-2 text-text-muted">
                                <PenTool size={16} /> Taille du message ({config.tailleMessage}px)
                            </label>
                            <input
                                type="range"
                                min="12"
                                max="30"
                                value={config.tailleMessage}
                                onChange={(e) => setConfig({ ...config, tailleMessage: e.target.value })}
                                className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="border-t border-glass-border my-4"></div>

                        {/* Text Inputs */}
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="form-label text-text-muted">Nom de l'étudiant (Exemple)</label>
                                <input
                                    type="text"
                                    value={config.studentName}
                                    onChange={(e) => setConfig({ ...config, studentName: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label text-text-muted">Intitulé de la formation</label>
                                <input
                                    type="text"
                                    value={config.courseTitle}
                                    onChange={(e) => setConfig({ ...config, courseTitle: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label text-text-muted">Nom du formateur (Exemple)</label>
                                <input
                                    type="text"
                                    value={config.trainerName}
                                    onChange={(e) => setConfig({ ...config, trainerName: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label text-text-muted">Date</label>
                                    <input
                                        type="date"
                                        value={config.date}
                                        onChange={(e) => setConfig({ ...config, date: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-text-muted">Score (%)</label>
                                    <input
                                        type="number"
                                        value={config.score}
                                        onChange={(e) => setConfig({ ...config, score: e.target.value })}
                                        className="form-input"
                                    />
                                </div>

                            </div>
                            <div className="form-group w-full">
                                <label className="form-label text-text-muted text-sm mb-2 block">
                                    Description du certificat
                                    <span className="block text-xs text-text-muted/70 mt-1 font-normal">
                                        Utilisez <strong>*texte*</strong> pour le gras, <strong>{'{course}'}</strong> pour le cours, <strong>{'{score}'}</strong> pour le score.
                                    </span>
                                </label>
                                <textarea
                                    value={config.message}
                                    onChange={(e) => setConfig({ ...config, message: e.target.value })}
                                    className="form-input w-full !h-auto !min-h-[150px] resize-y leading-relaxed" style={{}}
                                    placeholder="Entrez la description du certificat..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="lg:col-span-2 overflow-auto max-h-[800px] flex flex-col justify-center items-center p-8 bg-surface-hover/30 rounded-2xl border border-glass-border">
                        <div
                            ref={certificateRef}
                            className="relative bg-white text-black shadow-2xl overflow-hidden certificate-preview-container"
                            style={{
                                width: '297mm',
                                height: '210mm',
                                padding: '40px',
                                display: 'flex',
                                flexDirection: 'column',
                                boxSizing: 'border-box'
                            }}
                        >
                            {/* Decorative Border */}
                            <div className="absolute inset-0 border-[10px] border-double border-gray-200 pointer-events-none"></div>
                            <div className="absolute inset-4 border-[2px] border-gray-800 pointer-events-none"></div>

                            {/* Corner Ornaments */}
                            <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-primary/20 pointer-events-none"></div>
                            <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-primary/20 pointer-events-none"></div>
                            <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-primary/20 pointer-events-none"></div>
                            <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-primary/20 pointer-events-none"></div>

                            {/* Header */}
                            <div className="header-section flex justify-between items-start mb-8 relative z-10">
                                <div className="flex items-center justify-start" style={{ height: `${config.tailleLogo}px` }}>
                                    {config.logo ? (
                                        <img src={getImageUrl(config.logo)} alt="Logo" style={{ height: `${config.tailleLogo}px` }} className="object-contain" />
                                    ) : (
                                        <div className="text-gray-300 text-sm border border-dashed border-gray-300 p-2 rounded">Logo</div>
                                    )}
                                </div>
                                {/* QR Code Placeholder */}
                                <div style={{ width: `${config.tailleQR}px`, height: `${config.tailleQR}px` }} className="bg-white border border-gray-300 flex items-center justify-center p-1">
                                    <QrCode size={parseInt(config.tailleQR) * 0.9} color="#000" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="content-section flex-1 flex flex-col items-center justify-center text-center z-10 space-y-6">
                                <h1 className="certificate-title text-5xl font-serif font-bold text-gray-900 tracking-wide uppercase mb-2 whitespace-pre-wrap">
                                    {config.title}
                                </h1>
                                <p className="text-xl text-gray-600 font-serif italic whitespace-pre-wrap">
                                    {config.subtitle}
                                </p>

                                <h2 className="text-4xl font-bold text-primary border-b-2 border-primary pb-2 px-8 min-w-[400px]">
                                    {config.studentName}
                                </h2>

                                <p className="text-gray-700 max-w-2xl mt-12 whitespace-pre-wrap" style={{ fontSize: `${config.tailleMessage}px` }}>
                                    {renderWithBold(config.message)}
                                </p>

                                <div className="certificate-date-wrapper">
                                    <p className="text-gray-500">Délivré le {new Date(config.date).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="footer-section flex justify-between items-end mt-12 px-12 relative z-10 w-full">
                                <div className="text-center">
                                    <div className="flex items-end justify-center mb-2" style={{ height: `${config.tailleCachet}px` }}>
                                        {config.cachet ? (
                                            <img src={getImageUrl(config.cachet)} alt="Cachet" style={{ height: `${config.tailleCachet}px` }} className="object-contain opacity-80 rotate-[-12deg]" />
                                        ) : (
                                            <div className="h-16 w-16 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 rotate-[-12deg]">
                                                Cachet
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-400 w-48 pt-2">
                                        <p className="font-bold text-sm uppercase text-gray-800">Cachet de l'établissement</p>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-end justify-center mb-2" style={{ height: `${config.tailleSignature}px` }}>
                                        {config.signature ? (
                                            <img src={getImageUrl(config.signature)} alt="Signature" style={{ height: `${config.tailleSignature}px` }} className="object-contain" />
                                        ) : (
                                            <div className="h-12 w-32 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 font-script">
                                                Signature
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-400 w-48 pt-2">
                                        <p className="font-bold text-sm uppercase text-gray-800">{config.trainerName}</p>
                                        <p className="text-xs text-gray-500">Formateur Principal</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="mt-8 flex justify-center mb-4 w-full">
                            <button
                                onClick={handlePrint}
                                className="action-btn primary px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
                            >
                                <Printer size={24} />
                                Imprimer le Certificat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificatePage;
