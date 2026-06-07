
export interface Trainer {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    specialite: string;
}

export interface Learner {
    id: string;
    nom: string;
    prenom: string;
    cne: string;
    email: string;
    specialite: string;
}

export interface Speciality {
    id: string;
    name: string;
    type: 'Licence' | 'Master';
    semesters: string[]; // e.g., ["S1", "S2", ...]
}

export interface Certification {
    id: string;
    learnerId: string;
    trainerId: string;
    title: string;
    date: string;
}

export interface DashboardStats {
    trainersCount: number;
    learnersCount: number;
    certificationsCount: number;
    coursesCount: number;
    monthlyCertifications: { month: string; count: number }[];
}

export interface QuizSettings {
    mode: 'manual' | 'dynamic';
    aiGeneratedCount: number;
    totalQuestions: number;
    qcuCount: number;
    qcmCount: number;
    openCount: number;
    passingScore: number;
    timeLimit?: number; // in minutes
    isRandom?: boolean;
    generatedPool?: Question[];
    isAiDetectionEnabled?: boolean;
    aiDetectionType?: 'backend' | 'frontend';
    // Cheating detection controls
    detectPhone?: boolean;
    detectMultiplePersons?: boolean;
    detectForbiddenObjects?: boolean;
    detectLookingAway?: boolean;
    detectTabSwitch?: boolean;
    detectFullscreenExit?: boolean;
    detectWindowBlur?: boolean;
    detectSound?: boolean;
    verificationMode?: 'none' | 'qr_only' | 'face_check';
}

export interface BackendSpecialite {
    id: number;
    nom: string;
}

export interface Formation {
    id: number;
    nom: string;
}

export interface Course {
    id: string;
    title: string;
    specialiteId?: number;
    level: 'Licence' | 'Master' | 'Libre';
    formations?: Formation[];
    semesters: string[];
    prerequisites: string;
    description: string;
    coverImage?: string;
    sections: Section[];
    finalExam?: Quiz | null;
    examEnabled?: boolean;
    published?: boolean;
    contentCompleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    deadlineDate?: string;
    reminderDays?: number;
    timeTrackingEnabled?: boolean;
}

export interface Section {
    id: string;
    title: string;
    masseHoraire?: string;
    orderIndex?: number;
    subSections: SubSection[];
}

export interface SubSection {
    id: string;
    title: string;
    content: string;
    orderIndex?: number;
    videoUrl?: string;
    videoUrls?: string[];
    quiz?: Quiz;
    isTp?: boolean;
    tpPrompt?: string;
}

export interface Quiz {
    id: string;
    title?: string;
    questions?: Question[];
    settings?: QuizSettings;
}

export interface Question {
    id: string;
    type: 'QCU' | 'QCM' | 'OPEN';
    text: string;
    options: string[];
    correctAnswers: number[];
}
