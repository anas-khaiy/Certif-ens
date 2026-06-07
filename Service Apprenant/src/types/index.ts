
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
    nom: string;
    type?: 'Licence' | 'Master';
    semesters?: string[];
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
    generatedPool?: Question[];
    passingScore?: number;
    timeLimit?: number;
    isRandom?: boolean;
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

export interface Course {
    id: string;
    title: string;
    category: string;
    level: 'Licence' | 'Master';
    semesters: string[];
    prerequisites: string;
    description: string;
    coverImage?: string;
    sections: Section[];
    finalExam?: Quiz;
    examEnabled?: boolean;
    isPublished?: boolean;
    contentCompleted?: boolean;
    trainerName?: string;
    trainerSignature?: string;
    trainerImage?: string;
    updatedAt?: string;
    enrollmentId?: string;
    deadlineDate?: string;
    reminderDays?: number;
    formations?: Formation[];
    specialiteId?: number;
    timeTrackingEnabled?: boolean;
}

export interface Formation {
    id: string;
    nom: string;
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

