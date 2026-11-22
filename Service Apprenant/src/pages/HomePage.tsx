import { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Layers, 
  ShieldCheck, 
  Menu, 
  X, 
  Sparkles, 
  ChevronRight,
  MonitorPlay,
  Code,
  Shield,
  Brain,
  Video,
  ArrowRight,
  Tv,
  Sun,
  Moon,
  BookOpen,
  BarChart3,
  Award,
  ClipboardList,
  FolderOpen,
  Bell,
  Settings,
  Eye,
  FileText,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useInView, animate } from 'framer-motion';

// Animated counter used in the stats strip
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.8, ease: 'easeOut', onUpdate: (v) => setVal(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// Keyframes & helper classes for the animated home page (scoped by the hp- prefix)
const HOME_ANIM_CSS = `
@keyframes hp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes hp-float-slow { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-40px) scale(1.12); } }
@keyframes hp-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes hp-shine { 0% { transform: translateX(-120%) skewX(-20deg); } 60%,100% { transform: translateX(220%) skewX(-20deg); } }
@keyframes hp-ring { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.45); } 70% { box-shadow: 0 0 0 14px rgba(99,102,241,0); } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } }
.hp-gradient-text { background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1); background-size: 300% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: hp-gradient 6s ease infinite; }
.hp-float { animation: hp-float 6s ease-in-out infinite; }
.hp-float-delay { animation: hp-float 7s ease-in-out 1.2s infinite; }
.hp-orb { position: absolute; border-radius: 50%; pointer-events: none; animation: hp-float-slow 14s ease-in-out infinite; }
.hp-btn-shine { position: relative; overflow: hidden; }
.hp-btn-shine::after { content: ''; position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent); animation: hp-shine 3.2s ease-in-out infinite; }
.hp-btn-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
.hp-btn-lift:hover { transform: translateY(-3px) scale(1.03); }
.hp-pulse-ring { animation: hp-ring 2.2s ease-out infinite; }
.hp-feat-card img { transition: transform 0.7s ease; }
.hp-feat-card:hover img { transform: scale(1.1); }
.hp-hero-frame { position: relative; border-radius: 20px; padding: 2px; background: linear-gradient(120deg, #6366f1, #a855f7, #ec4899, #6366f1); background-size: 300% 300%; animation: hp-gradient 8s ease infinite; }
@media (prefers-reduced-motion: reduce) { .hp-float, .hp-float-delay, .hp-orb, .hp-gradient-text, .hp-btn-shine::after, .hp-pulse-ring, .hp-hero-frame { animation: none !important; } }
`;

type PortalRole = 'student' | 'teacher' | 'coordinator' | 'admin';

interface PortalData {
  id: PortalRole;
  shortTitle: string;
  targetAudience: string;
  badge: string;
  path: string;
}

const PORTALS_DATA: PortalData[] = [
  {
    id: 'student',
    shortTitle: 'Portail Étudiant',
    targetAudience: 'Accéder aux cours, passer les examens avec surveillance IA',
    badge: 'Apprenant',
    path: '/login'
  },
  {
    id: 'teacher',
    shortTitle: 'Espace Enseignant',
    targetAudience: 'Créer des cours, configurer les quiz IA et visioconférences',
    badge: 'Formateur',
    path: '/formateur/login'
  },
  {
    id: 'coordinator',
    shortTitle: 'Espace Coordinateur',
    targetAudience: 'Gérer les spécialités, affecter les cours et formateurs',
    badge: 'Coordinateur',
    path: '/coordinateur/login'
  },
  {
    id: 'admin',
    shortTitle: 'Console Admin',
    targetAudience: 'Administration globale du système et gestion des comptes',
    badge: 'Administrateur',
    path: '/admin/login'
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePortalDropdown, setActivePortalDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'formateur' | 'apprenant'>('all');
  const { scrollYProgress } = useScroll();
  const scrollBar = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  const handleOpenPortal = (role: PortalRole) => {
    const portal = PORTALS_DATA.find(p => p.id === role);
    if (portal) {
      window.location.href = portal.path;
    }
  };

  // Section « Tutoriels vidéo » masquée (passer à true pour la réafficher)
  const SHOW_TUTORIALS = false;
  // Section « Vidéo Démo Générale de la Plateforme » masquée (passer à true pour la réafficher)
  const SHOW_DEMO_VIDEO = false;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Décalage pour ne pas cacher le titre sous la barre de navigation fixe
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Fonctionnalités', id: 'features' },
    { label: 'Étapes', id: 'how-it-works' },
    { label: 'Sécurité', id: 'integrity' },
    { label: 'Atouts', id: 'strengths' },
    { label: 'Portails', id: 'portals' },
    { label: 'Démo Vidéo', id: 'hero-video' },
    { label: 'Tutoriels', id: 'tutorials' },
  ].filter(l => (SHOW_TUTORIALS || l.id !== 'tutorials') && (SHOW_DEMO_VIDEO || l.id !== 'hero-video'));

  // ── Sections « puissance de la plateforme » ──
  const howSteps = [
    { icon: <UserCheck style={{ width: 24, height: 24 }} />, title: 'Inscrivez-vous', desc: 'Créez votre compte en quelques secondes et recevez vos accès par e-mail.', color: '#6366f1' },
    { icon: <BookOpen style={{ width: 24, height: 24 }} />, title: 'Suivez vos cours', desc: 'Leçons, vidéos, TP de code et quiz intégrés, avec votre progression suivie en temps réel.', color: '#a855f7' },
    { icon: <ShieldCheck style={{ width: 24, height: 24 }} />, title: 'Passez des examens surveillés', desc: 'Quiz et examens supervisés par IA, corrigés automatiquement, y compris les questions ouvertes.', color: '#ec4899' },
    { icon: <Award style={{ width: 24, height: 24 }} />, title: 'Obtenez votre certificat', desc: 'Un certificat officiel avec QR code, vérifiable publiquement par n’importe qui.', color: '#10b981' },
  ];
  const proctorItems = [
    { icon: <Eye style={{ width: 20, height: 20 }} />, label: 'Surveillance par caméra en direct' },
    { icon: <Users style={{ width: 20, height: 20 }} />, label: 'Détection de plusieurs personnes' },
    { icon: <Shield style={{ width: 20, height: 20 }} />, label: 'Détection de téléphone et d’objets interdits' },
    { icon: <MonitorPlay style={{ width: 20, height: 20 }} />, label: 'Mode plein écran et anti-triche' },
    { icon: <UserCheck style={{ width: 20, height: 20 }} />, label: 'Vérification d’identité de l’apprenant' },
    { icon: <Brain style={{ width: 20, height: 20 }} />, label: 'Correction automatique par IA locale' },
  ];
  const strengths = [
    { icon: <Brain style={{ width: 26, height: 26 }} />, title: 'IA locale et sécurisée', desc: 'Génération de questions et correction sur vos propres serveurs : vos données restent à l’école.', color: '#6366f1' },
    { icon: <Video style={{ width: 26, height: 26 }} />, title: 'Classes en direct', desc: 'Visioconférence intégrée pour animer vos séances en temps réel avec vos apprenants.', color: '#a855f7' },
    { icon: <Code style={{ width: 26, height: 26 }} />, title: 'Éditeur de code intégré', desc: 'Exécution de code et suivi des TP directement dans la plateforme.', color: '#ec4899' },
    { icon: <BarChart3 style={{ width: 26, height: 26 }} />, title: 'Statistiques détaillées', desc: 'Tableaux de bord pour suivre les performances par cours, quiz et apprenant.', color: '#f59e0b' },
    { icon: <Award style={{ width: 26, height: 26 }} />, title: 'Certificats vérifiables', desc: 'Chaque certificat porte un QR code qui permet de vérifier son authenticité.', color: '#10b981' },
    { icon: <ClipboardList style={{ width: 26, height: 26 }} />, title: 'Suivi des PFE', desc: 'Dépôt, encadrement et remarques centralisés pour les projets de fin d’études.', color: '#06b6d4' },
  ];


  const tutorials = [
    { title: "#2 Formateur - Création et gestion des cours", id: "O88heNIMjp4", category: "formateur", desc: "Découvrez comment concevoir vos cours, éditer les sections et structurer le contenu pédagogique." },
    { title: "#3 Formateur - Examen final et configuration", id: "Am1Dhv1BZPA", category: "formateur", desc: "Configurez l'examen final avec les options de surveillance IA anti-triche et la génération de quiz." },
    { title: "#4 Formateur - Classes virtuelles (visioconférence)", id: "hWsuORn4b9E", category: "formateur", desc: "Lancez des cours interactifs en temps réel avec le système LiveKit WebRTC intégré." },
    { title: "#5 Formateur - Encadrement et gestion des tâches", id: "7lZQ_4fg1Jk", category: "formateur", desc: "Attribuez et suivez les tâches des étudiants dans le cadre de leurs projets (PFE)." },
    { title: "#6 Formateur Video - Code Tracker", id: "InamzoPTv-g", category: "formateur", desc: "Utilisez le module sandbox d'édition et d'exécution de code pour évaluer les compétences en programmation." },
    { title: "#7 Formateur - Tableau de bord du formateur", id: "QNpMeXvQz8o", category: "formateur", desc: "Analysez la progression des apprenants et gérez les statistiques clés d'apprentissage." },
    { title: "#8 Formateur - Paramètres du compte formateur", id: "xkWcTYKKQ9Y", category: "formateur", desc: "Gérez votre profil, vos informations personnelles et configurez votre signature numérique." },
    { title: "#9 Apprenant - Catalogue des cours et inscription", id: "bXLi4eoOyeo", category: "apprenant", desc: "Explorez le catalogue de formations, inscrivez-vous aux cours et suivez votre apprentissage." },
    { title: "#10 Apprenant - Surveillance IA pendant l'examen", id: "B2WADwnYKHQ", category: "apprenant", desc: "Déroulement de l'évaluation surveillée par l'IA (suivi du regard, détection d'objets, anti-triche)." },
    { title: "#11 Apprenant - Certification et partage des résultats", id: "I678KsyoAIQ", category: "apprenant", desc: "Générez vos certificats numériques sécurisés par QR-Code et partagez vos succès académiques." },
  ];

  const filteredTutorials = tutorials.filter(t => activeCategory === 'all' || t.category === activeCategory);

  // All platform features
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Surveillance IA & Anti-Triche",
      desc: "Détection en temps réel par YOLOv8 et MediaPipe : objets interdits (téléphones, livres), présence multiple, suivi du regard (gaze estimation), anti-absence et détection de changement d'onglet.",
      color: "var(--primary)",
      image: "/features/1. Surveillance IA & Anti-Triche.jpeg"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Assistant Pédagogique LLM",
      desc: "Génération automatique de quiz interactifs et de résumés de cours via des modèles d'IA locaux (Llama 3.2, Mistral, Qwen 2.5) avec Ollama — 100% local, confidentialité garantie.",
      color: "#a855f7",
      image: "/features/2. Assistant Pédagogique LLM.jpeg"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Visioconférence & Classes Virtuelles",
      desc: "Sessions vidéo en direct avec LiveKit WebRTC (architecture SFU) pour des cours interactifs en temps réel avec une qualité audio/vidéo optimale.",
      color: "#10b981",
      image: "/features/3. Visioconférence & Classes Virtuelles.jpeg"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Coding Sandbox Expert",
      desc: "Éditeur de code en ligne interactif (Monaco Editor) avec exécution sécurisée pour les formations en informatique — supporte Python, Java et plus.",
      color: "#ec4899",
      image: "/features/4. Coding Sandbox Expert.jpeg"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Catalogue & Gestion des Cours",
      desc: "Création de cours structurés avec sections, sous-sections, contenu riche (éditeur Quill), vidéos intégrées et quiz par chapitre. Les apprenants explorent et s'inscrivent librement.",
      color: "#3b82f6",
      image: "/features/5. Catalogue & Gestion des Cours.jpeg"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Examens & Quiz Dynamiques",
      desc: "Configuration flexible des examens : QCU, QCM, questions ouvertes, score de passage, limite de temps, génération automatique par IA et randomisation des questions.",
      color: "#f59e0b",
      image: "/features/6. Examens & Quiz Dynamiques.jpeg"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Certification Numérique Sécurisée",
      desc: "Génération automatique de certificats numériques vérifiables par QR-Code unique. Partage et validation de l'authenticité par lien public.",
      color: "#14b8a6",
      image: "/features/7. Certification Numérique Sécurisée.jpeg"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Tableaux de Bord & Statistiques",
      desc: "Statistiques détaillées pour chaque rôle : progression des apprenants, taux de réussite par cours, performances aux quiz et indicateurs d'activité globale.",
      color: "#6366f1",
      image: "/features/8. Tableaux de Bord & Statistiques.jpeg"
    },
    {
      icon: <ClipboardList className="w-6 h-6" />,
      title: "Encadrement & Suivi de Projet (PFE)",
      desc: "Module de gestion de tâches pour le suivi de projet de fin d'études : attribution, progression et évaluation des travaux de recherche des étudiants.",
      color: "#8b5cf6",
      image: "/features/9. Encadrement & Suivi de Projet PFE.jpeg"
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Surveillance du Navigateur",
      desc: "Détection des changements d'onglets, sortie du mode plein écran, perte de focus de la fenêtre et détection sonore — système anti-triche multicouche.",
      color: "#ef4444",
      image: "/features/10. Surveillance du Navigateur.jpeg"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-Portails Unifiés (4 Rôles)",
      desc: "Accès centralisé pour Administrateur, Formateur, Apprenant et Coordinateur — chaque portail offre une interface dédiée avec des fonctionnalités spécialisées.",
      color: "#0ea5e9",
      image: "/features/11. Multi-Portails Unifiés — 4 Rôles.jpeg"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Notifications & Rappels Intelligents",
      desc: "Système de notifications en temps réel (WebSocket) avec rappels automatiques de deadlines, alertes d'examens et suivi de progression des cours.",
      color: "#f97316",
      image: "/features/12. Notifications & Rappels Intelligents.jpeg"
    },
  ];

  return (
    <div style={{ 
      backgroundColor: 'var(--background)', 
      color: 'var(--text)', 
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      transition: 'background-color 0.3s ease, color 0.3s ease',
      position: 'relative', overflowX: 'hidden', isolation: 'isolate'
    }}>
      
      <style>{HOME_ANIM_CSS}</style>

      {/* Scroll progress bar */}
      <motion.div style={{ scaleX: scrollBar, transformOrigin: '0% 50%', position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 60, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />

      {/* Background Orbs (animated) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <div className="hp-orb" style={{ top: 0, left: '20%', width: 520, height: 520, background: isDark ? 'rgba(99,102,241,0.16)' : 'rgba(99,102,241,0.12)', filter: 'blur(120px)' }} />
        <div className="hp-orb" style={{ top: 700, right: '15%', width: 620, height: 620, background: isDark ? 'rgba(168,85,247,0.10)' : 'rgba(168,85,247,0.10)', filter: 'blur(150px)', animationDelay: '-5s' }} />
        <div className="hp-orb" style={{ top: 1500, left: '5%', width: 480, height: 480, background: isDark ? 'rgba(236,72,153,0.07)' : 'rgba(236,72,153,0.08)', filter: 'blur(140px)', animationDelay: '-9s' }} />
      </div>

      {/* ─── Navbar ─── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? (isDark ? 'rgba(6,7,18,0.95)' : 'rgba(255,255,255,0.95)') : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${isDark ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.08)'}` : 'none',
        padding: scrolled ? '12px 0' : '20px 0',
        boxShadow: scrolled ? (isDark ? '0 10px 40px rgba(30,27,75,0.3)' : '0 4px 20px rgba(0,0,0,0.06)') : 'none'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img 
              src={isDark ? "/logoDark.png?v=2" : "/logoLite.png?v=2"} 
              alt="ENS-Learning Logo" 
              style={{ height: 48, width: 'auto', objectFit: 'contain' }} 
            />
          </a>

          {/* Desktop Nav Links */}
          <nav style={{ alignItems: 'center', gap: 4 }} className="hp-desktop-nav">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => scrollToSection(link.id)}
                style={{ padding: '6px 14px', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >{link.label}</button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div style={{ alignItems: 'center', gap: 10 }} className="hp-desktop-actions">
            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              style={{
                width: 40, height: 40, borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(241,245,249,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
              title={isDark ? "Mode clair" : "Mode sombre"}>
              {isDark ? <Sun style={{ width: 18, height: 18, color: '#fbbf24' }} /> : <Moon style={{ width: 18, height: 18, color: '#6366f1' }} />}
            </button>

            {/* Portals dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActivePortalDropdown(!activePortalDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600,
                  color: 'var(--text)', backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(241,245,249,1)',
                  border: `1px solid ${isDark ? 'rgba(71,85,105,0.5)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                }}>
                <Layers style={{ width: 14, height: 14, color: '#818cf8' }} />
                <span>4 Portails</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34d399', animation: 'pulse 2s infinite' }} />
              </button>

              {activePortalDropdown && (
                <div style={{
                  position: 'absolute', right: 0, marginTop: 8, width: 288, padding: 8, borderRadius: 16,
                  backgroundColor: isDark ? '#090b16' : '#fff', border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 50
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Choisir votre espace
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {PORTALS_DATA.map((portal) => (
                      <button key={portal.id} onClick={() => { handleOpenPortal(portal.id); setActivePortalDropdown(false); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: 'none',
                          backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ padding: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                            {portal.id === 'student' && <GraduationCap style={{ width: 16, height: 16, color: '#60a5fa' }} />}
                            {portal.id === 'teacher' && <UserCheck style={{ width: 16, height: 16, color: '#a78bfa' }} />}
                            {portal.id === 'coordinator' && <Layers style={{ width: 16, height: 16, color: '#34d399' }} />}
                            {portal.id === 'admin' && <ShieldCheck style={{ width: 16, height: 16, color: '#fbbf24' }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{portal.shortTitle}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{portal.targetAudience}</div>
                          </div>
                        </div>
                        <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => handleOpenPortal('student')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: isDark ? '#93c5fd' : '#1d4ed8', backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)', border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.4)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
              <GraduationCap style={{ width: 14, height: 14, color: isDark ? '#60a5fa' : '#2563eb' }} /><span>Étudiant</span>
            </button>
            <button onClick={() => handleOpenPortal('teacher')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: isDark ? '#c4b5fd' : '#7c3aed', backgroundColor: isDark ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.08)', border: `1px solid ${isDark ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.4)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
              <UserCheck style={{ width: 14, height: 14, color: isDark ? '#a78bfa' : '#7c3aed' }} /><span>Enseignant</span>
            </button>
            <button onClick={() => handleOpenPortal('admin')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#fff', background: 'linear-gradient(to right, #4f46e5, #9333ea, #ec4899)', border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}>
              <ShieldCheck style={{ width: 14, height: 14, color: '#fcd34d' }} /><span>Console Admin</span>
            </button>
          </div>

          {/* Mobile */}
          <div style={{ alignItems: 'center', gap: 8 }} className="hp-mobile-actions">
            <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(241,245,249,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {isDark ? <Sun style={{ width: 16, height: 16, color: '#fbbf24' }} /> : <Moon style={{ width: 16, height: 16, color: '#6366f1' }} />}
            </button>
            <button onClick={() => handleOpenPortal('student')}
              style={{ padding: '6px 10px', color: '#93c5fd', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <GraduationCap style={{ width: 16, height: 16 }} /><span>Portail</span>
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ padding: 8, borderRadius: 12, color: 'var(--text-muted)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
              {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: isDark ? 'rgba(7,8,21,0.95)' : 'rgba(255,255,255,0.97)', borderBottom: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.08)'}`, padding: '12px 16px 24px', backdropFilter: 'blur(20px)' }} className="hp-mobile-drawer">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 8 }}>
              {PORTALS_DATA.map((p) => (
                <button key={p.id} onClick={() => { handleOpenPortal(p.id); setMobileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#f1f5f9', border: `1px solid ${isDark ? 'rgba(30,41,59,1)' : '#e2e8f0'}`, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                    {p.id === 'student' && <GraduationCap style={{ width: 16, height: 16, color: '#60a5fa' }} />}
                    {p.id === 'teacher' && <UserCheck style={{ width: 16, height: 16, color: '#a78bfa' }} />}
                    {p.id === 'coordinator' && <Layers style={{ width: 16, height: 16, color: '#34d399' }} />}
                    {p.id === 'admin' && <ShieldCheck style={{ width: 16, height: 16, color: '#fbbf24' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{p.shortTitle}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.badge}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ paddingTop: 8, marginTop: 8, borderTop: `1px solid ${isDark ? 'rgba(30,41,59,1)' : '#e2e8f0'}` }}>
              {navLinks.map(({ id, label }) => (
                <button key={id} onClick={() => { scrollToSection(id); setMobileMenuOpen(false); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <section style={{ paddingTop: 128, paddingBottom: 80, maxWidth: 1280, margin: '0 auto', padding: '128px 24px 80px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="hp-hero-grid"
        >
          
          {/* Left: Description */}
          <div className="hp-hero-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hp-pulse-ring"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, marginBottom: 20, fontSize: 12, fontWeight: 700, color: isDark ? '#c7d2fe' : '#4338ca', backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)', border: `1px solid ${isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.3)'}` }}
            >
              <Sparkles style={{ width: 14, height: 14, color: '#a855f7' }} /> Propulsé par l'IA • Examens surveillés • Certificats vérifiables
            </motion.div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <img src="/ens_logo_new.png" alt="ENS Logo" style={{ height: 64, width: 'auto', objectFit: 'contain', backgroundColor: '#fff', borderRadius: 8, padding: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }} />
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1' }}>École Normale Supérieure</h4>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Université Cadi Ayyad • Marrakech</p>
              </div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hp-gradient-text"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}
            >
              ENS-Learning
            </motion.h1>
            <h2 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 600, color: '#6366f1', marginBottom: 24 }}>
              Plateforme Intelligente de Certification Numérique et d'Apprentissage Assisté par IA
            </h2>

            <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: 'var(--text)' }}>ENS-Learning</strong> est une plateforme d'apprentissage en ligne dédiée aux étudiants et enseignants de l'École Normale Supérieure de Marrakech. Elle permet de suivre des cours, passer des examens surveillés, obtenir des certifications numériques et participer à des classes virtuelles en direct.
              </p>
              <p>
                Grâce à ses 4 espaces dédiés (Apprenant, Formateur, Coordinateur et Administrateur), chaque utilisateur dispose d'un environnement adapté à ses besoins : catalogue de formations, éditeur de cours enrichi, système d'évaluation intelligent, visioconférence intégrée et suivi de progression complet.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, paddingTop: 24 }}>
              <button onClick={() => scrollToSection('portals')} className="hp-btn-shine hp-btn-lift"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(79,70,229,0.35)', transition: 'all 0.2s' }}>
                <span>Accéder aux Portails</span><ArrowRight style={{ width: 16, height: 16 }} />
              </button>
              {SHOW_TUTORIALS && <button onClick={() => scrollToSection('tutorials')} className="hp-btn-lift"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, backgroundColor: isDark ? 'rgba(15,23,42,1)' : '#e2e8f0', color: 'var(--text)', fontSize: 14, fontWeight: 600, border: `1px solid ${isDark ? 'rgba(51,65,85,0.8)' : '#cbd5e1'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Tv style={{ width: 16, height: 16, color: '#a855f7' }} /><span>Tutoriels Vidéo</span>
              </button>}
            </div>
          </div>

          {/* Right: ENS Gate photo */}
          <div className="hp-hero-right hp-float" style={{ position: 'relative' }}>
            {/* Floating info chips */}
            <div className="hp-float-delay" style={{ position: 'absolute', top: -14, left: -10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: 'var(--text)', backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', border: `1px solid ${isDark ? 'rgba(99,102,241,0.35)' : '#e2e8f0'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
              <Shield style={{ width: 14, height: 14, color: '#6366f1' }} /> Surveillance IA
            </div>
            <div className="hp-float" style={{ position: 'absolute', bottom: 40, right: -10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: 'var(--text)', backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', border: `1px solid ${isDark ? 'rgba(16,185,129,0.35)' : '#e2e8f0'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }}>
              <Award style={{ width: 14, height: 14, color: '#10b981' }} /> Certificat QR-Code
            </div>
            <div className="hp-hero-frame">
            <div style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: 'var(--surface)', padding: 8, boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.08)' }}>
              <img src="/ens_gate.png" alt="École Normale Supérieure de Marrakech"
                style={{ width: '100%', height: 'auto', borderRadius: 12, objectFit: 'cover', aspectRatio: '4/3' }} />
              <div style={{ marginTop: 8, padding: '4px 8px', textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Entrée principale de l'École Normale Supérieure de Marrakech
                </span>
              </div>
            </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Animated stats strip ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { n: 12, s: '', label: 'Fonctionnalités', icon: <Sparkles style={{ width: 20, height: 20 }} />, c: '#6366f1' },
            { n: 4, s: '', label: 'Portails dédiés', icon: <Layers style={{ width: 20, height: 20 }} />, c: '#a855f7' },
            ...(SHOW_TUTORIALS ? [{ n: 10, s: '+', label: 'Tutoriels vidéo', icon: <Tv style={{ width: 20, height: 20 }} />, c: '#ec4899' }] : []),
            { n: 100, s: '%', label: 'IA locale & sécurisée', icon: <Brain style={{ width: 20, height: 20 }} />, c: '#10b981' },
          ].map((st, i) => (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.03 }}
              style={{ padding: '20px 16px', borderRadius: 16, textAlign: 'center', backgroundColor: isDark ? 'rgba(15,23,42,0.55)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}`, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.05)', backdropFilter: 'blur(8px)' }}
            >
              <div style={{ width: 40, height: 40, margin: '0 auto 10px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.c, backgroundColor: st.c + '1f' }}>{st.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}><CountUp to={st.n} suffix={st.s} /></div>
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{st.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Video Demo Section ─── */}
      {SHOW_DEMO_VIDEO && (
      <section id="hero-video" style={{ padding: '80px 0', backgroundColor: isDark ? 'rgba(2,6,23,0.4)' : 'rgba(241,245,249,1)', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.875rem)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Vidéo Démo Générale de la Plateforme</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 40px', fontSize: 14 }}>Découvrez le fonctionnement global d'ENS-Learning, de la visioconférence au proctoring par IA.</p>
          <div style={{ maxWidth: 800, margin: '0 auto', borderRadius: 24, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : '#e2e8f0'}`, boxShadow: isDark ? '0 20px 60px rgba(30,27,75,0.3)' : '0 10px 30px rgba(0,0,0,0.08)', padding: 1, background: isDark ? 'linear-gradient(to right, rgba(99,102,241,0.3), rgba(168,85,247,0.3), rgba(236,72,153,0.3))' : 'none' }}>
            <div style={{ backgroundColor: isDark ? '#0b0c16' : '#fff', borderRadius: 23, overflow: 'hidden', aspectRatio: '16/9' }}>
              <iframe src="https://www.youtube.com/embed/2PMhDPUQqKI" title="Vidéo Démo ENS-Learning" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </motion.div>
      </section>
      )}

      {/* ─── Features Section (ALL 12 Features) ─── */}
      <section id="features" style={{ padding: '96px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: 'var(--text)' }}>Toutes les fonctionnalités de la plateforme</h2>
          <p style={{ marginTop: 12, color: 'var(--text-muted)', maxWidth: 600, margin: '12px auto 0', fontSize: 14 }}>
            ENS-Learning allie la puissance de l'IA multimodale, le temps réel et la gestion pédagogique pour un apprentissage complet et sécurisé.
          </p>
        </motion.div>

        <div className="hp-grid-3">
          {features.map((feat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              key={i} 
              className="hp-feat-card"
              style={{
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(15,23,42,0.4)' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
              transition: 'all 0.3s ease', cursor: 'default',
              boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = feat.color + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              
              <div style={{ width: '100%', height: 160, position: 'relative', overflow: 'hidden' }}>
                <img src={feat.image} alt={feat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: feat.color, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {feat.icon}
                </div>
              </div>

              <div style={{ padding: 24, flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{feat.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" style={{ padding: '96px 24px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: 'var(--text)' }}>Du premier cours au certificat, en 4 étapes</h2>
          <p style={{ marginTop: 12, color: 'var(--text-muted)', maxWidth: 560, margin: '12px auto 0', fontSize: 14 }}>Un parcours simple, guidé et entièrement numérique.</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24 }}>
          {howSteps.map((st, i) => (
            <motion.div key={st.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{ position: 'relative', padding: 28, borderRadius: 20, backgroundColor: isDark ? 'rgba(15,23,42,0.5)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 44, fontWeight: 900, color: st.color, opacity: 0.12, lineHeight: 1 }}>{i + 1}</div>
              <div className="hp-pulse-ring" style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: `linear-gradient(135deg, ${st.color}, ${st.color}aa)`, marginBottom: 18 }}>{st.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{st.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{st.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Proctoring / integrity ─── */}
      <section id="integrity" style={{ padding: '56px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ borderRadius: 28, padding: 'clamp(28px, 5vw, 56px)', background: isDark ? 'linear-gradient(135deg, rgba(79,70,229,0.18), rgba(168,85,247,0.12) 55%, rgba(236,72,153,0.10))' : 'linear-gradient(135deg, #eef2ff, #f5f3ff 55%, #fdf2f8)', border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : '#e0e7ff'}` }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#6366f1', backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#fff', border: '1px solid rgba(99,102,241,0.25)' }}>
              <ShieldCheck style={{ width: 14, height: 14 }} /> Intégrité académique
            </span>
            <h2 style={{ marginTop: 16, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: 'var(--text)' }}>Des examens à distance en toute confiance</h2>
            <p style={{ marginTop: 12, color: 'var(--text-muted)', maxWidth: 620, margin: '12px auto 0', fontSize: 14, lineHeight: 1.7 }}>
              La surveillance par IA s’active pendant les quiz et examens supervisés. Les formateurs choisissent, pour chaque évaluation, le niveau de supervision.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {proctorItems.map((it, i) => (
              <motion.div key={it.label} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, backgroundColor: isDark ? 'rgba(2,6,23,0.55)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff' }}>{it.icon}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{it.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Strengths ─── */}
      <section id="strengths" style={{ padding: '56px 24px 96px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: 'var(--text)' }}>Pourquoi choisir <span className="hp-gradient-text">ENS-Learning</span> ?</h2>
          <p style={{ marginTop: 12, color: 'var(--text-muted)', maxWidth: 580, margin: '12px auto 0', fontSize: 14 }}>Tout ce qu’il faut pour enseigner, évaluer et certifier, réuni sur une seule plateforme.</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {strengths.map((st, i) => (
            <motion.div key={st.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: (i % 3) * 0.1 }}
              whileHover={{ y: -6 }}
              style={{ display: 'flex', gap: 18, padding: 26, borderRadius: 20, backgroundColor: isDark ? 'rgba(15,23,42,0.5)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.color, backgroundColor: st.color + '1f' }}>{st.icon}</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{st.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{st.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Portals Section ─── */}
      <section id="portals" style={{ padding: '80px 0', backgroundColor: isDark ? 'rgba(2,6,23,0.4)' : 'rgba(241,245,249,1)', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.875rem)', fontWeight: 700, color: 'var(--text)' }}>Choisissez votre Espace de Travail</h2>
            <p style={{ marginTop: 12, color: 'var(--text-muted)', maxWidth: 500, margin: '12px auto 0' }}>
              ENS-Learning fournit une expérience adaptée pour chaque profil de l'établissement grâce à 4 portails interconnectés.
            </p>
          </motion.div>

          <div className="hp-grid-4">
            {PORTALS_DATA.map((portal, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                key={portal.id} 
                whileHover={{ y: -8, scale: 1.02 }}
                style={{
                borderRadius: 16, border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                backgroundColor: isDark ? 'rgba(15,23,42,0.2)' : '#fff', padding: 24,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'all 0.3s', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'; }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: 'var(--text-muted)' }}>{portal.badge}</span>
                    <div style={{ padding: 8, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                      {portal.id === 'student' && <GraduationCap style={{ width: 20, height: 20, color: '#60a5fa' }} />}
                      {portal.id === 'teacher' && <UserCheck style={{ width: 20, height: 20, color: '#a78bfa' }} />}
                      {portal.id === 'coordinator' && <Layers style={{ width: 20, height: 20, color: '#34d399' }} />}
                      {portal.id === 'admin' && <ShieldCheck style={{ width: 20, height: 20, color: '#fbbf24' }} />}
                    </div>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{portal.shortTitle}</h3>
                  <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{portal.targetAudience}</p>
                </div>
                <button onClick={() => handleOpenPortal(portal.id)}
                  style={{ marginTop: 24, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; e.currentTarget.style.color = 'var(--text)'; }}>
                  <span>Rejoindre l'espace</span><ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tutorials Section ─── */}
      {SHOW_TUTORIALS && (
      <section id="tutorials" style={{ padding: '96px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 48 }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.875rem)', fontWeight: 700, color: 'var(--text)' }}>Tutoriels vidéo de la plateforme</h2>
            <p style={{ marginTop: 8, color: 'var(--text-muted)', maxWidth: 450, fontSize: 14 }}>Consultez nos tutoriels pas à pas pour configurer vos cours ou comprendre le déroulement des examens surveillés.</p>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 4, backgroundColor: isDark ? 'rgba(15,23,42,1)' : '#e2e8f0', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#cbd5e1'}`, borderRadius: 12 }}>
            {(['all', 'formateur', 'apprenant'] as const).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeCategory === cat ? '#4f46e5' : 'transparent', color: activeCategory === cat ? '#fff' : 'var(--text-muted)', boxShadow: activeCategory === cat ? '0 2px 8px rgba(79,70,229,0.3)' : 'none' }}>
                {cat === 'all' ? 'Tous' : cat === 'formateur' ? 'Enseignants' : 'Étudiants'}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="hp-grid-3">
          {filteredTutorials.map((tuto, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              key={idx} 
              style={{
              borderRadius: 16, border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
              backgroundColor: isDark ? 'rgba(2,6,23,0.6)' : '#fff', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', transition: 'all 0.3s',
              boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}>
              <div style={{ aspectRatio: '16/9', backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                <iframe src={`https://www.youtube.com/embed/${tuto.id}`} title={tuto.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%' }} />
              </div>
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{
                    display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
                    backgroundColor: tuto.category === 'formateur' ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)',
                    color: tuto.category === 'formateur' ? '#a78bfa' : '#60a5fa',
                    border: `1px solid ${tuto.category === 'formateur' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)'}`
                  }}>{tuto.category === 'formateur' ? 'Formateur' : 'Apprenant'}</span>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8 }}>{tuto.title}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{tuto.desc}</p>
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}>
                  <a href={`https://www.youtube.com/watch?v=${tuto.id}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Regarder sur YouTube</span><ArrowRight style={{ width: 12, height: 12 }} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      )}

      {/* ─── Footer ─── */}
      <footer style={{ backgroundColor: isDark ? 'rgba(2,6,23,1)' : '#f1f5f9', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`, padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src={isDark ? "/logoDark.png?v=2" : "/logoLite.png?v=2"} 
              alt="ENS-Learning Logo" 
              style={{ height: 36, width: 'auto', objectFit: 'contain' }} 
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plateforme d'apprentissage intelligente de l'ENS - Marrakech</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, opacity: 0.7 }}>© {new Date().getFullYear()} ENS-Learning — Conçu pour l'excellence pédagogique et l'intégrité numérique.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
