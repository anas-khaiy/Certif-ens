package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Course;
import com.certiflow.formateur.repository.CourseRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CourseService {

    private final CourseRepository repository;
    private final com.certiflow.formateur.repository.EnseignantRepository enseignantRepository;

    public CourseService(CourseRepository repository,
            com.certiflow.formateur.repository.EnseignantRepository enseignantRepository) {
        this.repository = repository;
        this.enseignantRepository = enseignantRepository;
    }

    public List<Course> getAllCourses() {
        return repository.findAllByOrderByUpdatedAtDesc();
    }

    public List<Course> getCoursesByTrainer(Long trainerId) {
        return repository.findByEnseignantIdOrderByUpdatedAtDesc(trainerId);
    }

    public List<Course> getCoursesByTrainerEmail(String email) {
        return repository.findByEnseignantEmailOrderByUpdatedAtDesc(email);
    }

    public Course getCourseById(Long id) {
        return repository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "Course not found"));
    }

    public Course saveCourseWithTrainer(Course course, String email) {
        com.certiflow.formateur.model.Enseignant enseignant = enseignantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));
        course.setEnseignant(enseignant);
        return saveCourse(course);
    }

    public Course saveCourse(Course course) {
        // Link sections, subsections, quizzes, and questions logic
        if (course.getSections() != null) {
            course.getSections().forEach(section -> {
                section.setCourse(course);
                if (section.getSubSections() != null) {
                    section.getSubSections().forEach(subSection -> {
                        subSection.setSection(section);
                        if (subSection.getQuiz() != null) {
                            if (subSection.getQuiz().getQuestions() != null) {
                                subSection.getQuiz().getQuestions().forEach(q -> q.setQuiz(subSection.getQuiz()));
                            }
                        }
                    });
                }
            });
        }
        if (course.getFinalExam() != null) {
            if (course.getFinalExam().getQuestions() != null) {
                course.getFinalExam().getQuestions().forEach(q -> q.setQuiz(course.getFinalExam()));
            }
        }
        return repository.save(course);
    }

    public Course updateCourse(Long id, Course course) {
        Course existingCourse = getCourseById(id);
        course.setId(id);
        // Preserve enseignant if not provided in the payload
        if (course.getEnseignant() == null) {
            course.setEnseignant(existingCourse.getEnseignant());
        }
        return saveCourse(course);
    }

    public void deleteCourse(Long id) {
        repository.deleteById(id);
    }
}
