import { useState, useEffect, useCallback } from 'react';
import type { Course } from '../types';
import api from '../api/api-client';

export const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const sortCourseContent = (course: any) => {
        if (!course) return course;
        const sortedSections = (course.sections || [])
            .sort((a: any, b: any) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity))
            .map((s: any) => ({
                ...s,
                subSections: (s.subSections || [])
                    .sort((a: any, b: any) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity))
            }));
        return { ...course, sections: sortedSections };
    };

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/courses');
            const sorted = response.data.map(sortCourseContent);
            setCourses(sorted);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const addCourse = useCallback(async (course: Course) => {
        try {
            const response = await api.post('/courses', course);
            const sorted = sortCourseContent(response.data);
            setCourses(prev => [...prev, sorted]);
            return sorted;
        } catch (error) {
            console.error("Failed to add course", error);
            throw error;
        }
    }, []);

    const updateCourse = useCallback(async (updatedCourse: Course) => {
        if (!updatedCourse.id || updatedCourse.id === 'new') {
            const error = new Error("Cannot update course without a valid ID");
            console.error(error);
            throw error;
        }
        try {
            const response = await api.put(`/courses/${updatedCourse.id}`, updatedCourse);
            const sorted = sortCourseContent(response.data);
            setCourses(prev => prev.map(c => c.id === updatedCourse.id ? sorted : c));
            return sorted;
        } catch (error) {
            console.error("Failed to update course", error);
            throw error;
        }
    }, []);

    const deleteCourse = useCallback(async (id: string) => {
        try {
            await api.delete(`/courses/${id}`);
            setCourses(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete course", error);
            throw error;
        }
    }, []);

    const getCourse = useCallback(async (id: string) => {
        try {
            const response = await api.get(`/courses/${id}`);
            return sortCourseContent(response.data);
        } catch (error) {
            console.error("Failed to get course", error);
            return null;
        }
    }, []);

    return {
        courses,
        isLoading,
        addCourse,
        updateCourse,
        deleteCourse,
        getCourse,
        refreshCourses: fetchCourses
    };
};
