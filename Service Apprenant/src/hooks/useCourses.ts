import { useState, useEffect, useCallback } from 'react';
import type { Course } from '../types';
import api from '../api/api-client';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

export const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/courses');
            const rawData = response.data;
            if (!Array.isArray(rawData)) {
                setCourses([]);
                setError("Format de données invalide");
                return;
            }
            const mappedCourses: Course[] = rawData.map((c: any) => ({
                ...c,
                id: c.id?.toString() || "",
                sections: (c.sections || [])
                    .sort((a: any, b: any) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity))
                    .map((s: any) => ({
                        ...s,
                        id: s.id?.toString() || "",
                        subSections: (s.subSections || [])
                            .sort((a: any, b: any) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity))
                            .map((ss: any) => ({
                                ...ss,
                                id: ss.id?.toString() || "",
                            }))
                    })),
                category: c.category || 'Cours',
                specialiteId: c.specialiteId ?? c.specialite_id ?? null,
                trainerName: c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : 'Formateur Inconnu',
                trainerImage: c.enseignant?.photoProfile ? `${API_FORMATEUR}/files/profiles/${c.enseignant.photoProfile}` : undefined,
                coverImage: c.coverImage ? (
                    c.coverImage.startsWith('http') || c.coverImage.startsWith('data:')
                        ? c.coverImage
                        : `${API_FORMATEUR}/files/content-images/${c.coverImage}`
                ) : undefined,
                deadlineDate: c.deadlineDate ?? c.deadline_date,
                reminderDays: c.reminderDays ?? c.reminder_days,
            }));
            setCourses(mappedCourses);
            setError(null);
        } catch (err) {
            console.error("Error fetching courses:", err);
            setError("Impossible de charger les cours.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const getCourse = useCallback(async (id: string) => {
        try {
            const response = await api.get(`/courses/${id}`);
            const c = response.data;
            return {
                ...c,
                id: c.id.toString(),
                sections: (c.sections || [])
                    .sort((a: any, b: any) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity))
                    .map((s: any) => ({
                        ...s,
                        id: s.id.toString(),
                        subSections: (s.subSections || [])
                            .sort((a: any, b: any) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity))
                            .map((ss: any) => ({
                                ...ss,
                                id: ss.id.toString(),
                            }))
                    })),
                category: c.category || 'Cours',
                trainerName: c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : 'Formateur Inconnu',
                trainerImage: c.enseignant?.photoProfile ? `${API_FORMATEUR}/files/profiles/${c.enseignant.photoProfile}` : undefined,
                coverImage: c.coverImage ? (
                    c.coverImage.startsWith('http') || c.coverImage.startsWith('data:')
                        ? c.coverImage
                        : `${API_FORMATEUR}/files/content-images/${c.coverImage}`
                ) : undefined,
                deadlineDate: c.deadlineDate ?? c.deadline_date,
                reminderDays: c.reminderDays ?? c.reminder_days,
            } as Course & { specialiteId: number | null };
        } catch (err) {
            console.error("Error fetching course:", err);
            return undefined;
        }
    }, []);

    return {
        courses,
        loading,
        error,
        getCourse,
        refreshCourses: fetchCourses
    };
};

