export interface Specialite {
    id: number;
    nom: string;
}

export interface Formation {
    id: number;
    nom: string;
}

export interface Departement {
    id: number;
    nom: string;
}

export interface Cycle {
    id: number;
    nomCycle: string;
}

export interface Coordinateur {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photoProfile?: string;
    departement?: Departement;
    specialite?: Specialite;
}


export interface Enseignant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    motDePasse?: string;
    photoProfile?: string;
    signature?: string;
    specialite?: Specialite;
}

export interface Apprenant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    motDePasse?: string;
    cin: string;
    photoProfile?: string;
    tailleQR?: string;
    specialite?: Specialite;
    cycle?: Cycle;
    sexe?: string;
    formation?: Formation;
}

export interface Certification {
    id: number;
    learnerName: string;
    title: string;
    date: string;
    score: number;
    status: string;
}

export interface DashboardStats {
    enseignantsCount: number;
    apprenantsCount: number;
    certificationsCount: number;
    successRate: number;
}
