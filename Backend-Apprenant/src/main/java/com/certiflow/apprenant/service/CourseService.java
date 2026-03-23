package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.Course;
import com.certiflow.apprenant.model.Specialite;
import com.certiflow.apprenant.repository.CourseRepository;
import com.certiflow.apprenant.repository.SpecialiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository repository;
    private final SpecialiteRepository specialiteRepository;

    public CourseService(CourseRepository repository, SpecialiteRepository specialiteRepository) {
        this.repository = repository;
        this.specialiteRepository = specialiteRepository;
    }

    private Map<Long, String> getSpecialiteMap() {
        try {
            return specialiteRepository.findAll().stream()
                    .filter(s -> s.getId() != null && s.getNom() != null)
                    .collect(Collectors.toMap(
                            Specialite::getId, 
                            Specialite::getNom,
                            (existing, replacement) -> existing
                    ));
        } catch (Exception e) {
            return new java.util.HashMap<>();
        }
    }

    private void enrichWithSpecialiteNom(Course course, Map<Long, String> specialiteMap) {
        if (course.getSpecialiteId() != null) {
            course.setSpecialiteNom(specialiteMap.getOrDefault(course.getSpecialiteId(), null));
        }
    }

    public List<Course> getPublishedCourses() {
        List<Course> courses = repository.findByPublishedTrueOrderByUpdatedAtDesc();
        Map<Long, String> specialiteMap = getSpecialiteMap();
        courses.forEach(c -> enrichWithSpecialiteNom(c, specialiteMap));
        return courses;
    }

    public Course getCourseById(Long id) {
        Course course = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!course.isPublished()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course is not published");
        }

        Map<Long, String> specialiteMap = getSpecialiteMap();
        enrichWithSpecialiteNom(course, specialiteMap);
        return course;
    }
}
