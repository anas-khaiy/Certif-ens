package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByCourseId(Long courseId);

    void deleteByCourseIdAndQuizId(Long courseId, String quizId);
}
