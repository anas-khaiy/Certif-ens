import { useState, useEffect, useCallback } from 'react';
import api from '../api/api-client';

export interface ReminderItem {
    id: string; // Original courseId for navigation
    key: string; // Unique key (bundleId-courseId)
    title: string;
    deadline?: string;
    reminderDays: number;
    daysRemaining?: number;
    type: 'deadline' | 'general';
}

export const useReminders = () => {
    const [reminders, setReminders] = useState<ReminderItem[]>([]);
    const [loading, setLoading] = useState(false);

    const checkReminders = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch trainer's enrollments and published bundles (to get full course details)
            const [enrollRes, bundlesRes] = await Promise.all([
                api.get('/bundles/trainer/my-enrollments'),
                api.get('/bundles/trainer/published')
            ]);

            const enrollments = Array.isArray(enrollRes.data) ? enrollRes.data : [];
            const bundles = Array.isArray(bundlesRes.data) ? bundlesRes.data : [];
            
            if (enrollments.length === 0) {
                setReminders([]);
                return;
            }

            const reminderList: ReminderItem[] = [];
            const now = Date.now();

            for (const item of enrollments) {
                const enrollment = item.enrollment;
                if (!enrollment || enrollment.status !== 'ACCEPTED') continue;

                const bundle = bundles.find(b => b.id === enrollment.bundleId);
                if (!bundle || !bundle.courses) continue;

                for (const course of bundle.courses) {
                    const courseId = course.id;
                    
                    // Check if course is already finished (final exam passed)
                    const quizResultsRes = await api.get(`/progress/${courseId}/quizzes`);
                    const resultsData = quizResultsRes.data;
                    const results = Array.isArray(resultsData) ? resultsData : [];
                    
                    const finalExamId = course.finalExam?.id;
                    const hasFinishedCertif = results.some((r: any) => 
                        (String(r.quizId) === 'final_exam' || (finalExamId && String(r.quizId) === String(finalExamId))) && 
                        r.passed
                    );

                    if (hasFinishedCertif) continue;

                    const deadlineStr = course.deadlineDate; // Backend-Formateur uses camelCase
                    const reminderDays = course.reminderDays || 0;
                    const threshold = Math.max(reminderDays, 3); // minimum 3 days for alert

                    if (deadlineStr) {
                        const deadlineTime = new Date(deadlineStr).getTime();

                        if (!isNaN(deadlineTime)) {
                            const diffMs = deadlineTime - now;
                            const diffDays = diffMs / (1000 * 60 * 60 * 24);
                            
                            if (diffDays <= threshold) { 
                                reminderList.push({
                                    id: courseId.toString(),
                                    key: `${enrollment.bundleId}-${courseId}`,
                                    title: course.title,
                                    deadline: new Date(deadlineStr).toLocaleDateString('fr-FR'),
                                    reminderDays,
                                    daysRemaining: Math.ceil(diffDays),
                                    type: 'deadline'
                                });
                            }
                        }
                    } else if (reminderDays > 0) {
                        reminderList.push({
                            id: courseId.toString(),
                            key: `${enrollment.bundleId}-${courseId}`,
                            title: course.title,
                            reminderDays,
                            type: 'general'
                        });
                    }
                }
            }
            setReminders(reminderList);
        } catch (err) {
            console.error("Error checking reminders:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkReminders();
    }, [checkReminders]);

    return { reminders, loading, refresh: checkReminders };
};
