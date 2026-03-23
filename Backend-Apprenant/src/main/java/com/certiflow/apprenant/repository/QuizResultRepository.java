package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByApprenantIdAndCourseId(Long apprenantId, Long courseId);

    List<QuizResult> findByApprenantId(Long apprenantId);

    List<QuizResult> findByApprenantIdAndCourseIdAndQuizId(Long apprenantId, Long courseId, String quizId);

    List<QuizResult> findByCourseIdAndQuizId(Long courseId, String quizId);

    @Modifying
    @Transactional
    @Query("DELETE FROM QuizResult qr WHERE qr.courseId = :courseId AND qr.quizId = :quizId")
    void deleteByCourseIdAndQuizId(@Param("courseId") Long courseId, @Param("quizId") String quizId);
}
