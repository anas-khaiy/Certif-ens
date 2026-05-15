import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, X } from 'lucide-react';
import api from '../api/api-client';
import { QRCodeSVG } from 'qrcode.react';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface BundleCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    bundleId: number;
    enrollmentId: number;
    bundleTitle: string;
}

interface PerformanceData {
    averageScore: number;
    quizCount: number;
}

interface UserProfile {
    prenom: string;
    nom: string;
    email: string;
}

interface CertificatePrototype {
    logo: string;
    cachet: string;
    signature: string;
    tailleQR: string;
    tailleLogo: string;
    tailleCachet: string;
    tailleSignature: string;
    tailleMessage: string;
    title: string;
    subtitle: string;
    message: string;
}

const ADMIN_API = API_ADMIN;

const BundleCertificateModal: React.FC<BundleCertificateModalProps> = ({ isOpen, onClose, bundleId, enrollmentId, bundleTitle }) => {
    const [performance, setPerformance] = useState<PerformanceData | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [prototype, setPrototype] = useState<CertificatePrototype | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const certificateRef = useRef<HTMLDivElement>(null);

    const getImageUrl = (filename: string) => {
        if (!filename) return '';
        if (filename.startsWith('data:') || filename.startsWith('http')) return filename;
        return `${ADMIN_API}/files/certificates/${filename}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const renderWithBold = (text: string, title: string, score: string) => {
        const dynamicText = (text || '')
            .replace(/{course}/g, title)
            .replace(/{score}/g, score);
        return dynamicText.split('*').map((part, index) =>
            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        );
    };

    const handlePrint = () => {
        setIsGenerating(true);
        setTimeout(() => {
            if (!certificateRef.current) return;
            const printContent = certificateRef.current.outerHTML;

            const allCSS = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules).map(r => r.cssText).join('');
                    } catch { return ''; }
                })
                .join('');

            const printWindow = window.open('', '', 'width=1400,height=900');
            if (printWindow) {
                printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Certificat - ${bundleTitle || 'Formation'}</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    body { margin: 0; padding: 0; background: #fff;
           display: flex; justify-content: center; align-items: center;
           min-height: 100vh;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    ${allCSS}
  </style>
</head>
<body>
  ${printContent}
  <script>setTimeout(() => { window.print(); window.close(); }, 1000);<\/script>
</body>
</html>`);
                printWindow.document.close();
            }
            setIsGenerating(false);
        }, 300);
    };

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [perfRes, userRes] = await Promise.all([
                        api.get(`/bundles/trainer/my-enrollments/${bundleId}/performance`),
                        api.get('/auth/me')
                    ]);
                    setPerformance(perfRes.data);
                    setUserProfile(userRes.data);

                    // Fetch certificate prototype from Admin Backend
                    try {
                        const protoRes = await fetch(`${ADMIN_API}/prototypes`);
                        if (protoRes.ok) {
                            const data = await protoRes.json();
                            if (data && data.length > 0) {
                                const p = data[0];
                                setPrototype({
                                    ...p,
                                    tailleQR: String(p.tailleQR || 100),
                                    tailleLogo: String(p.tailleLogo || 96),
                                    tailleCachet: String(p.tailleCachet || 96),
                                    tailleMessage: String(p.tailleMessage || 18),
                                });
                            }
                        }
                    } catch (e) {
                        console.error("Error fetching admin prototype:", e);
                    }
                } catch (err) {
                    console.error("Failed to fetch certificate data", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, bundleId]);

    const renderCertificate = () => {
        const score = String(Math.round(performance?.averageScore || 100));
        const learnerName = userProfile ? `${userProfile.prenom} ${userProfile.nom}` : 'Apprenant';
        const proto = prototype;
        const qrSize = parseInt(proto?.tailleQR || '100');
        const logoH = parseInt(proto?.tailleLogo || '96');
        const cachetH = parseInt(proto?.tailleCachet || '96');
        const msgSize = parseInt(proto?.tailleMessage || '18');
        const currentCertId = `BND-${enrollmentId}`;

        return (
            <div
                ref={certificateRef}
                style={{
                    width: '297mm',
                    height: '210mm',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    background: 'white',
                    color: 'black',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'Georgia, serif',
                }}
            >
                <div style={{ position: 'absolute', inset: 0, border: '10px double #e5e7eb', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: '16px', border: '2px solid #1f2937', pointerEvents: 'none' }} />

                <div style={{ position: 'absolute', top: '24px', left: '24px', width: '64px', height: '64px', borderTop: '4px solid #c7d2fe', borderLeft: '4px solid #c7d2fe', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '24px', right: '24px', width: '64px', height: '64px', borderTop: '4px solid #c7d2fe', borderRight: '4px solid #c7d2fe', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '64px', height: '64px', borderBottom: '4px solid #c7d2fe', borderLeft: '4px solid #c7d2fe', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '64px', height: '64px', borderBottom: '4px solid #c7d2fe', borderRight: '4px solid #c7d2fe', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
                    <div style={{ height: `${logoH}px`, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {proto?.logo ? (
                            <img src={getImageUrl(proto.logo)} alt="Logo" style={{ height: `${logoH}px`, objectFit: 'contain' }} />
                        ) : (
                            <div style={{ color: '#d1d5db', fontSize: '14px', border: '1px dashed #d1d5db', padding: '8px', borderRadius: '4px' }}>Logo</div>
                        )}
                    </div>
                    <div style={{ width: `${qrSize}px`, height: `${qrSize}px`, background: 'white', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', boxSizing: 'border-box' }}>
                        <QRCodeSVG
                            value={`${VERIFY_URL_FORMATEUR}/${currentCertId}`}
                            size={Math.round(qrSize * 0.9)}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', zIndex: 10, gap: '12px' }}>
                    <h1 style={{ fontSize: '48px', fontFamily: 'Georgia, serif', fontWeight: 'bold', color: '#111827', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'pre-wrap', margin: '0 0 4px 0' }}>
                        {proto?.title || 'Certificat de Réussite'}
                    </h1>
                    <p style={{ fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#4b5563', margin: 0 }}>
                        {proto?.subtitle || 'Délivré à'}
                    </p>

                    <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#4f46e5', borderBottom: '2px solid #4f46e5', paddingBottom: '8px', paddingLeft: '32px', paddingRight: '32px', minWidth: '400px', margin: '4px 0' }}>
                        {learnerName}
                    </h2>

                    <p style={{ fontSize: `${msgSize}px`, color: '#374151', maxWidth: '640px', whiteSpace: 'pre-wrap', margin: '16px 0 0 0', lineHeight: '1.6' }}>
                        {proto?.message
                            ? renderWithBold(proto.message, bundleTitle, score)
                            : <>Pour avoir complété avec succès le parcours de certification <strong>{bundleTitle}</strong> avec un score de <strong>{score}%</strong>.</>
                        }
                    </p>

                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0 0' }}>Délivré le {formatDate('')}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: '48px', paddingRight: '48px', position: 'relative', zIndex: 10, width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: `${cachetH}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                            {proto?.cachet ? (
                                <img src={getImageUrl(proto.cachet)} alt="Cachet" style={{ height: `${cachetH}px`, objectFit: 'contain', opacity: 0.8, transform: 'rotate(-12deg)' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#9ca3af', transform: 'rotate(-12deg)' }}>Cachet</div>
                            )}
                        </div>
                        <div style={{ borderTop: '1px solid #1f2937', width: '192px', paddingTop: '8px', textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', color: '#1f2937', margin: 0 }}>Cachet de l'établissement</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ borderTop: '1px solid #1f2937', width: '192px', paddingTop: '8px', textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', color: '#1f2937', margin: 0 }}>L'Équipe Académique</p>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>Formateur Principal</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md no-print"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-6xl bg-surface border border-glass-border rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border no-print">
                        <h4 className="text-lg font-black text-text flex items-center gap-2">
                            <Award size={20} className="text-primary" />
                            Certificat — {bundleTitle}
                        </h4>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
                                disabled={isGenerating || loading}
                                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-black hover:bg-primary-hover shadow-lg transition-all text-sm"
                            >
                                <Download size={16} /> Imprimer / PDF
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-muted">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto bg-[#f3f4f6] flex items-center justify-center py-6 min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="text-text-muted font-black uppercase tracking-widest text-xs">Chargement du certificat...</p>
                            </div>
                        ) : (
                            <div style={{ width: 'calc(297mm * 0.72)', height: 'calc(210mm * 0.72)', position: 'relative' }}>
                                <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, width: '297mm', height: '210mm' }}>
                                    {renderCertificate()}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default BundleCertificateModal;
