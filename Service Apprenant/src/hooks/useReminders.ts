import { useState, useEffect, useCallback } from 'react';
import api from '../api/api-client';

export interface ReminderItem {
    id: string;
    title: string;
    deadline?: string;
    reminderDays: number;
    daysRemaining?: number;
    type: 'deadline' | 'general' | 'alert';
    taskAlert?: string;
}

export const useReminders = () => {
    const [reminders, setReminders] = useState<ReminderItem[]>([]);
    const [loading, setLoading] = useState(false);

    const checkReminders = useCallback(async () => {
        setLoading(true);
        try {
            const enrollResponse = await api.get('/enrollments/my/accepted');
            const rawEnrollments = enrollResponse.data;
            const enrollments = Array.isArray(rawEnrollments) ? rawEnrollments : [];
            
            if (enrollments.length === 0) {
                setReminders([]);
                return;
            }

            const reminderList: ReminderItem[] = [];
            const now = Date.now();

            for (const e of enrollments) {
                const course = e?.course;
                if (!course || !course.id) continue;
                const courseId = course.id;
                
                // Check if course is already finished
                const quizResultsRes = await api.get(`/progress/${courseId}/quizzes`);
                const resultsData = quizResultsRes.data;
                const results = Array.isArray(resultsData) ? resultsData : [];
                
                const finalExamId = course.finalExam?.id;
                const hasFinishedCertif = results.some((r: any) => 
                    (String(r.quizId) === 'final_exam' || (finalExamId && String(r.quizId) === String(finalExamId))) && 
                    r.passed
                );

                if (hasFinishedCertif) continue;

                const deadlineStr = course.deadlineDate || course.deadline_date;
                const reminderDays = course.reminderDays || course.reminder_days || 0;
                const threshold = Math.max(reminderDays, 3); // minimum 3 days for alert

                console.log(`Checking Course ${courseId}: deadline=${deadlineStr}, reminderDays=${reminderDays}, threshold=${threshold}`);

                if (deadlineStr) {
                    let deadlineTime: number;
                    if (String(deadlineStr).includes('/')) {
                        const [d, m, y] = String(deadlineStr).split('/').map(Number);
                        deadlineTime = new Date(y, m - 1, d, 23, 59, 59).getTime();
                    } else {
                        deadlineTime = new Date(String(deadlineStr).replace(' ', 'T')).getTime();
                    }

                    if (!isNaN(deadlineTime)) {
                        const diffMs = deadlineTime - now;
                        const diffDays = diffMs / (1000 * 60 * 60 * 24);
                        
                        console.log(`Course ${courseId} DiffDays: ${diffDays}`);

                        if (diffDays <= threshold) { 
                            reminderList.push({
                                id: courseId.toString(),
                                title: course.title,
                                deadline: deadlineStr,
                                reminderDays,
                                daysRemaining: Math.ceil(diffDays),
                                type: 'deadline'
                            });
                        }
                    }
                } else if (reminderDays > 0) {
                    console.log(`Course ${courseId}: No deadline, showing general reminder`);
                    reminderList.push({
                        id: courseId.toString(),
                        title: course.title,
                        reminderDays,
                        type: 'general'
                    });
                }
            }

            // Fetch Encadrements for Alerts
            try {
                const encResponse = await api.get('/encadrement/mine');
                const plans = Array.isArray(encResponse.data) ? encResponse.data : [];
                plans.forEach((plan: any) => {
                    const phases = Array.isArray(plan.phases) ? plan.phases : [];
                    phases.forEach((phase: any) => {
                        const tasks = Array.isArray(phase.tasks) ? phase.tasks : [];
                        tasks.forEach((task: any) => {
                            if (task.alertMessage) {
                                reminderList.push({
                                    id: `task-${task.id}`,
                                    title: task.title || 'Tâche (Sans titre)',
                                    reminderDays: 0,
                                    type: 'alert',
                                    taskAlert: task.alertMessage
                                });
                            }
                        });
                    });
                });
            } catch (encErr) {
                console.error("Error fetching encadrement alerts:", encErr);
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
