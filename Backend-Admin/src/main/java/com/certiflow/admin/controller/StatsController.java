package com.certiflow.admin.controller;

import com.certiflow.admin.model.Apprenant;

import com.certiflow.admin.repository.ApprenantRepository;

import com.certiflow.admin.repository.EnseignantRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public StatsController(EnseignantRepository enseignantRepository,
                           ApprenantRepository apprenantRepository) {
        this.enseignantRepository = enseignantRepository;
        this.apprenantRepository = apprenantRepository;
    }

    @GetMapping("/certifications-detail")
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getCertificationsDetail() {
        List<Object[]> rows = entityManager.createNativeQuery(
            "SELECT a.nom, a.prenom, a.email, c.title " +
            "FROM course_progress cp " +
            "JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
            "JOIN apprenants a ON a.id = cp.apprenant_id " +
            "JOIN courses c ON c.id = cp.course_id " +
            "WHERE e.status = 'ACCEPTED' " +
            "AND cp.completed_sub_section_ids IS NOT NULL " +
            "AND cp.completed_sub_section_ids != '' " +
            "AND (SELECT COUNT(ss.id) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) > 0 " +
            "AND (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) >= " +
            "    (SELECT COUNT(ss.id) FROM sub_sections ss " +
            "     JOIN sections s ON ss.section_id = s.id " +
            "     WHERE s.course_id = cp.course_id) " +
            "AND (c.final_exam_id IS NULL OR EXISTS (" +
            "    SELECT 1 FROM quiz_results qr " +
            "    WHERE qr.apprenant_id = cp.apprenant_id AND qr.course_id = cp.course_id AND qr.passed = true " +
            "    AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(c.final_exam_id AS VARCHAR)) " +
            ")) " +
            "GROUP BY cp.apprenant_id, cp.course_id, a.nom, a.prenom, a.email, c.title " +
            "ORDER BY a.nom, a.prenom"
        ).getResultList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("nom", row[0]);
            entry.put("prenom", row[1]);
            entry.put("email", row[2]);
            entry.put("cours", row[3]);
            result.add(entry);
        }
        return result;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("enseignantsCount", enseignantRepository.count());

        List<Apprenant> apprenants = apprenantRepository.findAll();
        stats.put("apprenantsCount", apprenants.size());

        // 100% progress query (reused for cert count)
        String completionQuery = 
            "SELECT cp.apprenant_id, cp.course_id " +
            "FROM course_progress cp " +
            "JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
            "JOIN courses co ON co.id = cp.course_id " +
            "WHERE e.status = 'ACCEPTED' " +
            "AND cp.completed_sub_section_ids IS NOT NULL AND cp.completed_sub_section_ids != '' " +
            "AND (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) > 0 " +
            "AND (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) >= " +
            "    (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) " +
            "AND (co.final_exam_id IS NULL OR co.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = cp.apprenant_id AND qr.course_id = cp.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(co.final_exam_id AS VARCHAR))))";

        long certCount;
        try {
            Object result = entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT id) FROM (" +
                "  SELECT apprenant_id as id FROM (" + completionQuery + ") as c" +
                "  UNION " +
                "  SELECT a.id FROM certifications cert JOIN apprenants a ON LOWER(TRIM(a.nom || ' ' || a.prenom)) = LOWER(TRIM(cert.learner_name))" +
                ") as t"
            ).getSingleResult();
            certCount = ((Number) result).longValue();
        } catch (Exception ex) {
            certCount = 0;
        }
        stats.put("certificationsCount", certCount);

        // Success rate based on COMPLETION (matches Analytics)
        double successRateVal;
        try {
            String srQuery = 
                "SELECT COALESCE(CAST(COUNT(CASE WHEN (total_ss > 0 AND done_ss >= total_ss AND (final_exam_id IS NULL OR exam_enabled = false OR has_passed_exam = true)) THEN 1 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 0) " +
                "FROM (" +
                "  SELECT e.id, " +
                "  (SELECT count(ss.id) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = e.course_id) as total_ss, " +
                "  (SELECT CASE WHEN cp.completed_sub_section_ids = '' OR cp.completed_sub_section_ids IS NULL THEN 0 " +
                "               ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END " +
                "   FROM course_progress cp WHERE cp.apprenant_id = e.apprenant_id AND cp.course_id = e.course_id LIMIT 1) as done_ss, " +
                "  (SELECT c.final_exam_id FROM courses c WHERE c.id = e.course_id) as final_exam_id, " +
                "  (SELECT c.exam_enabled FROM courses c WHERE c.id = e.course_id) as exam_enabled, " +
                "  EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = e.apprenant_id AND qr.course_id = e.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST((SELECT c.final_exam_id FROM courses c WHERE c.id = e.course_id) AS VARCHAR))) as has_passed_exam " +
                "  FROM enrollments e WHERE e.status = 'ACCEPTED'" +
                ") as t";
            successRateVal = ((Number) entityManager.createNativeQuery(srQuery).getSingleResult()).doubleValue();
        } catch (Exception ex) {
            successRateVal = 0;
        }
        stats.put("successRate", Math.round(successRateVal));

        // Specialty distribution
        List<Map<String, Object>> pieData = apprenants.stream()
                .collect(Collectors.groupingBy(
                        a -> (a.getSpecialite() != null && a.getSpecialite().getNom() != null)
                             ? a.getSpecialite().getNom() : "Inconnu",
                        Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", e.getKey());
                    map.put("value", e.getValue());
                    return map;
                })
                .collect(Collectors.toList());
        stats.put("specialtyDistribution", pieData);

        // Monthly chart (last 6 months) - real data
        List<Map<String, Object>> chartData = new ArrayList<>();
        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        
        @SuppressWarnings("unchecked")
        List<Object[]> monthlyRows = entityManager.createNativeQuery(
            "SELECT TO_CHAR(COALESCE(e.processed_at, e.requested_at, CURRENT_TIMESTAMP), 'YYYY-MM') as m_key, COUNT(*) as cnt " +
            "FROM (" + completionQuery + ") as c " +
            "JOIN enrollments e ON e.apprenant_id = c.apprenant_id AND e.course_id = c.course_id " +
            "WHERE COALESCE(e.processed_at, e.requested_at) >= CURRENT_DATE - INTERVAL '6 months' " +
            "GROUP BY m_key ORDER BY m_key"
        ).getResultList();

        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : monthlyRows) {
            countMap.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        for (int i = 5; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusMonths(i);
            String monthKey = d.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
            String monthLabel = monthNames[d.getMonthValue() - 1];
            Map<String, Object> m = new HashMap<>();
            m.put("month", monthLabel);
            m.put("certs", countMap.getOrDefault(monthKey, 0L));
            chartData.add(m);
        }
        stats.put("monthlyCertifications", chartData);

        return stats;
    }

    @GetMapping("/trainers")
    @SuppressWarnings("unchecked")
    public Map<String, Object> getTrainersStats() {
        Map<String, Object> result = new HashMap<>();
        
        // Global KPIs
        long totalTrainers = enseignantRepository.count();
        
        long totalCourses;
        try {
            totalCourses = ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM courses").getSingleResult()).longValue();
        } catch (Exception e) {
            totalCourses = 0;
        }

        // Reuse unified certCount logic
        long totalCertifications;
        try {
            String cpQuery = 
                "SELECT cp.apprenant_id, cp.course_id FROM course_progress cp " +
                "JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
                "JOIN courses co ON co.id = cp.course_id " +
                "WHERE e.status = 'ACCEPTED' AND cp.completed_sub_section_ids IS NOT NULL AND cp.completed_sub_section_ids != '' " +
                "AND (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) > 0 " +
                "AND (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) >= " +
                "    (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) " +
                "AND (co.final_exam_id IS NULL OR co.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = cp.apprenant_id AND qr.course_id = cp.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(co.final_exam_id AS VARCHAR))))";

            totalCertifications = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT id) FROM (" +
                "  SELECT apprenant_id as id FROM (" + cpQuery + ") as c" +
                "  UNION " +
                "  SELECT a.id FROM certifications cert JOIN apprenants a ON LOWER(TRIM(a.nom || ' ' || a.prenom)) = LOWER(TRIM(cert.learner_name))" +
                ") as t"
            ).getSingleResult()).longValue();
        } catch (Exception e) {
            totalCertifications = 0;
        }

        result.put("totalTrainers", totalTrainers);
        result.put("totalCourses", totalCourses);
        result.put("totalCertifications", totalCertifications);

        // Detailed trainers data
        List<Object[]> trainerRows = entityManager.createNativeQuery(
            "SELECT " +
            "  ens.nom, ens.prenom, " +
            "  (SELECT COUNT(*) FROM courses c WHERE c.enseignant_id = ens.id) as courses_count, " +
            "  (SELECT COUNT(DISTINCT e.apprenant_id) FROM enrollments e " +
            "   JOIN courses c ON e.course_id = c.id " +
            "   WHERE c.enseignant_id = ens.id AND e.status = 'ACCEPTED') as unique_learners, " +
            "  (SELECT COUNT(e.id) FROM enrollments e " +
            "   JOIN courses c ON e.course_id = c.id " +
            "   WHERE c.enseignant_id = ens.id AND e.status = 'ACCEPTED') as total_enrollments, " +
            "  (SELECT COUNT(*) FROM (" +
            "    SELECT cp.apprenant_id, cp.course_id " +
            "    FROM course_progress cp " +
            "    JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
            "    JOIN courses c ON e.course_id = c.id " +
            "    WHERE c.enseignant_id = ens.id AND e.status = 'ACCEPTED' " +
            "    AND cp.completed_sub_section_ids IS NOT NULL " +
            "    AND cp.completed_sub_section_ids != '' " +
            "    AND (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) >= " +
            "        (SELECT COUNT(ss.id) FROM sub_sections ss " +
            "         JOIN sections s ON ss.section_id = s.id " +
            "         WHERE s.course_id = cp.course_id) " +
            "    AND (SELECT COUNT(ss.id) FROM sub_sections ss " +
            "         JOIN sections s ON ss.section_id = s.id " +
            "         WHERE s.course_id = cp.course_id) > 0 " +
            "    AND (c.final_exam_id IS NULL OR c.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = cp.apprenant_id AND qr.course_id = cp.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(c.final_exam_id AS VARCHAR)))) " +
            "  ) as t2) as certs_count " +
            "FROM enseignants ens"
        ).getResultList();

        List<Map<String, Object>> trainersList = new ArrayList<>();
        for (Object[] row : trainerRows) {
            Map<String, Object> t = new HashMap<>();
            t.put("name", row[0] + " " + row[1]);
            t.put("courses", ((Number) row[2]).longValue());
            t.put("learners", ((Number) row[3]).longValue());
            t.put("enrollments", ((Number) row[4]).longValue());
            t.put("certifications", ((Number) row[5]).longValue());
            trainersList.add(t);
        }
        result.put("trainersData", trainersList);

        return result;
    }

    @GetMapping("/learners")
    public Map<String, Object> getLearnersStats() {
        Map<String, Object> result = new HashMap<>();

        // 1. KPIs
        long totalLearners = apprenantRepository.count();
        
        long activeLearners;
        try {
            // "Active" = having at least one accepted enrollment
            activeLearners = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT apprenant_id) FROM enrollments WHERE status = 'ACCEPTED'"
            ).getSingleResult()).longValue();
        } catch (Exception e) {
            activeLearners = 0;
        }

        long certCount;
        try {
            certCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM (" +
                "  SELECT cp.apprenant_id, cp.course_id " +
                "  FROM course_progress cp " +
                "  JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
                "  JOIN courses co ON co.id = cp.course_id " +
                "  WHERE e.status = 'ACCEPTED' " +
                "  AND cp.completed_sub_section_ids IS NOT NULL " +
                "  AND cp.completed_sub_section_ids != '' " +
                "  AND (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) >= " +
                "      (SELECT COUNT(ss.id) FROM sub_sections ss " +
                "       JOIN sections s ON ss.section_id = s.id " +
                "       WHERE s.course_id = cp.course_id) " +
                "  AND (SELECT COUNT(ss.id) FROM sub_sections ss " +
                "       JOIN sections s ON ss.section_id = s.id " +
                "       WHERE s.course_id = cp.course_id) > 0 " +
                "  AND (co.final_exam_id IS NULL OR co.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = cp.apprenant_id AND qr.course_id = cp.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(co.final_exam_id AS VARCHAR)))) " +
                "  GROUP BY cp.apprenant_id, cp.course_id" +
                ") AS t"
            ).getSingleResult()).longValue();
        } catch (Exception e) {
            certCount = 0;
        }

        long totalEnrollments;
        try {
            totalEnrollments = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM enrollments WHERE status = 'ACCEPTED'"
            ).getSingleResult()).longValue();
        } catch (Exception e) {
            totalEnrollments = 1;
        }

        double certRate = totalEnrollments > 0 ? (certCount * 100.0 / totalEnrollments) : 0;

        result.put("totalLearners", totalLearners);
        result.put("activeLearners", activeLearners);
        result.put("totalEnrollments", totalEnrollments);
        result.put("certificationRate", Math.round(certRate));

        // 2. Evolution Chart (Enrollments)
        List<Map<String, Object>> enrollmentChart = new ArrayList<>();
        try {
            @SuppressWarnings("unchecked")
            List<Object[]> chartRows = entityManager.createNativeQuery(
                "SELECT " +
                "  TO_CHAR(requested_at, 'Mon') as label, " +
                "  COUNT(*) as total, " +
                "  COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as active, " +
                "  EXTRACT(YEAR FROM requested_at) as y, " +
                "  EXTRACT(MONTH FROM requested_at) as m " +
                "FROM enrollments " +
                "WHERE requested_at >= CURRENT_DATE - INTERVAL '6 months' " +
                "GROUP BY label, y, m " +
                "ORDER BY y, m"
            ).getResultList();

            Map<String, Object[]> monthDataMap = new HashMap<>();
            for (Object[] row : chartRows) {
                monthDataMap.put(row[0].toString(), row);
            }

            for (int i = 5; i >= 0; i--) {
                LocalDate d = LocalDate.now().minusMonths(i);
                String label = d.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                Map<String, Object> m = new HashMap<>();
                m.put("month", label);
                if (monthDataMap.containsKey(label)) {
                    Object[] dataRow = monthDataMap.get(label);
                    m.put("students", ((Number) dataRow[1]).longValue());
                    m.put("active", ((Number) dataRow[2]).longValue());
                } else {
                    m.put("students", 0L);
                    m.put("active", 0L);
                }
                enrollmentChart.add(m);
            }
        } catch (Exception e) {
            for (int i = 5; i >= 0; i--) {
                LocalDate d = LocalDate.now().minusMonths(i);
                Map<String, Object> m = new HashMap<>();
                m.put("month", d.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                m.put("students", 0L);
                m.put("active", 0L);
                enrollmentChart.add(m);
            }
        }
        result.put("enrollmentData", enrollmentChart);

        // 3. Distribution Apprenants by Specialty
        @SuppressWarnings("unchecked")
        List<Object[]> levels = entityManager.createNativeQuery(
            "SELECT s.nom, COUNT(a.id) FROM apprenants a " +
            "JOIN specialites s ON a.specialite_id = s.id " +
            "GROUP BY s.nom"
        ).getResultList();
        
        List<Map<String, Object>> levelData = new ArrayList<>();
        for (Object[] row : levels) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", row[0]);
            m.put("value", row[1]);
            levelData.add(m);
        }
        result.put("levelData", levelData);

        // 3b. Courses by Specialty
        @SuppressWarnings("unchecked")
        List<Object[]> coursesBySpec = entityManager.createNativeQuery(
            "SELECT s.nom, COUNT(c.id) FROM courses c " +
            "JOIN specialites s ON c.specialite_id = s.id " +
            "GROUP BY s.nom"
        ).getResultList();
        
        List<Map<String, Object>> coursesBySpecData = new ArrayList<>();
        for (Object[] row : coursesBySpec) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", row[0]);
            m.put("value", row[1]);
            coursesBySpecData.add(m);
        }
        result.put("coursesBySpec", coursesBySpecData);

        // 3c. Gender Distribution (Count unique learners by email to avoid duplicates)
        @SuppressWarnings("unchecked")
        List<Object[]> genderRows = entityManager.createNativeQuery(
            "SELECT gLabel, COUNT(DISTINCT email) FROM (" +
            "  SELECT " +
            "    CASE " +
            "      WHEN LOWER(TRIM(sexe)) = 'femme' THEN 'Femme' " +
            "      WHEN LOWER(TRIM(sexe)) = 'homme' THEN 'Homme' " +
            "      ELSE 'Non spécifié' " +
            "    END as gLabel, " +
            "    email " +
            "  FROM apprenants" +
            ") as t " +
            "GROUP BY gLabel"
        ).getResultList();
        
        List<Map<String, Object>> genderData = new ArrayList<>();
        for (Object[] row : genderRows) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", row[0].toString());
            m.put("value", row[1]);
            genderData.add(m);
        }
        result.put("genderData", genderData);

        // 4. Top Learners
        @SuppressWarnings("unchecked")
        List<Object[]> topRows = entityManager.createNativeQuery(
            "SELECT a.nom, a.prenom, s.nom as specialty, f.nom as formation_name, " +
            "  (SELECT COUNT(*) FROM (" +
            "    SELECT cp.course_id FROM course_progress cp " +
            "    JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
            "    WHERE e.apprenant_id = a.id AND e.status = 'ACCEPTED' " +
            "    AND cp.completed_sub_section_ids IS NOT NULL " +
            "    AND (CASE WHEN cp.completed_sub_section_ids = '' THEN 0 " +
            "              ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END) >= " +
            "        (SELECT COUNT(ss.id) FROM sub_sections ss " +
            "         JOIN sections sec ON ss.section_id = sec.id " +
            "         WHERE sec.course_id = cp.course_id) " +
            "    AND (SELECT COUNT(ss.id) FROM sub_sections ss " +
            "         JOIN sections sec ON ss.section_id = sec.id " +
            "         WHERE sec.course_id = cp.course_id) > 0 " +
            "  ) as t) as completed_courses, " +
            "  (SELECT COALESCE(AVG(p_val), 0) FROM (" +
            "    SELECT " +
            "      CASE WHEN (SELECT COUNT(ss.id) FROM sub_sections ss JOIN sections sec ON ss.section_id = sec.id WHERE sec.course_id = cp.course_id) = 0 THEN 0 " +
            "      ELSE LEAST(100.0, (CAST((CASE WHEN cp.completed_sub_section_ids IS NULL OR cp.completed_sub_section_ids = '' THEN 0 " +
            "                       ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END) AS FLOAT) / " +
            "           (SELECT COUNT(ss.id) FROM sub_sections ss JOIN sections sec ON ss.section_id = sec.id WHERE sec.course_id = cp.course_id)) * 100) " +
            "      END as p_val " +
            "    FROM course_progress cp " +
            "    JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
            "    WHERE e.apprenant_id = a.id AND e.status = 'ACCEPTED' " +
            "  ) as t2) as avg_progress " +
            "FROM apprenants a " +
            "LEFT JOIN specialites s ON a.specialite_id = s.id " +
            "LEFT JOIN formations f ON a.formation_id = f.id " +
            "ORDER BY completed_courses DESC, avg_progress DESC " +
            "LIMIT 10"
        ).getResultList();

        List<Map<String, Object>> topLearners = new ArrayList<>();
        for (Object[] row : topRows) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", row[0] + " " + row[1]);
            m.put("speciality", row[2] != null ? row[2] : "N/A");
            m.put("formation", row[3] != null ? row[3] : "N/A");
            m.put("courses", row[4]);
            m.put("score", Math.round(((Number) row[5]).doubleValue())); 
            m.put("avatar", (row[0].toString().substring(0,1) + row[1].toString().substring(0,1)).toUpperCase());
            topLearners.add(m);
        }
        result.put("topLearners", topLearners);

        // 5. All Specialties (for filter)
        @SuppressWarnings("unchecked")
        List<String> allSpecialties = entityManager.createNativeQuery("SELECT nom FROM specialites ORDER BY nom").getResultList();
        result.put("allSpecialties", allSpecialties);

        // 6. All Formations (for filter)
        @SuppressWarnings("unchecked")
        List<String> allFormations = entityManager.createNativeQuery("SELECT nom FROM formations ORDER BY nom").getResultList();
        result.put("allFormations", allFormations);

        return result;
    }

    @GetMapping("/certifications")
    public Map<String, Object> getCertificationsStats() {
        Map<String, Object> result = new HashMap<>();

        // 1. Calculate Issued (Manual + Automated from 100% progress)
        // We consider someone "Certified" if they are in the table OR have 100% progress
        String completionQuery = 
            "SELECT cp.apprenant_id, cp.course_id " +
            "FROM course_progress cp " +
            "JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
            "JOIN courses co ON co.id = cp.course_id " +
            "WHERE e.status = 'ACCEPTED' " +
            "AND cp.completed_sub_section_ids IS NOT NULL " +
            "AND (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) > 0 " +
            "AND (CASE WHEN cp.completed_sub_section_ids = '' THEN 0 " +
            "          ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END) >= " +
            "    (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) " +
            "AND (co.final_exam_id IS NULL OR co.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = cp.apprenant_id AND qr.course_id = cp.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(co.final_exam_id AS VARCHAR))))";

        Number totalIssuedCount = (Number) entityManager.createNativeQuery(
            "SELECT COUNT(DISTINCT id) FROM (" +
            "  SELECT id FROM certifications WHERE LOWER(status) LIKE 'd_livr%'" +
            "  UNION ALL " +
            "  SELECT (apprenant_id + course_id * 1000) as id FROM (" + completionQuery + ") as comp" +
            ") as combined"
        ).getSingleResult();

        // Pending: All ACCEPTED enrollments that are NOT at 100%
        Number totalPendingCount = (Number) entityManager.createNativeQuery(
            "SELECT COUNT(DISTINCT e.id) FROM enrollments e " +
            "JOIN courses c ON c.id = e.course_id " +
            "WHERE e.status = 'ACCEPTED' AND NOT EXISTS (" +
            "    SELECT 1 FROM course_progress cp " +
            "    WHERE cp.apprenant_id = e.apprenant_id AND cp.course_id = e.course_id " +
            "    AND cp.completed_sub_section_ids IS NOT NULL " +
            "    AND (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = e.course_id) > 0 " +
            "    AND (CASE WHEN cp.completed_sub_section_ids = '' THEN 0 " +
            "              ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END) >= " +
            "        (SELECT count(*) FROM sub_sections ss2 JOIN sections s2 ON ss2.section_id = s2.id WHERE s2.course_id = e.course_id) " +
            "    AND (c.final_exam_id IS NULL OR c.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = e.apprenant_id AND qr.course_id = e.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(c.final_exam_id AS VARCHAR))))" +
            ")"
        ).getSingleResult();
        
        Number avgScoreVal = (Number) entityManager.createNativeQuery(
            "SELECT COALESCE(AVG(score), 0) FROM (" +
            "  SELECT CAST(score AS FLOAT) as score FROM certifications" +
            "  UNION ALL " +
            "  SELECT CAST(score AS FLOAT) as score FROM quiz_results" +
            ") as t"
        ).getSingleResult();

        result.put("totalIssued", totalIssuedCount.intValue());
        result.put("totalPending", totalPendingCount.intValue());
        result.put("avgScore", Math.round(avgScoreVal.doubleValue()));

        // 2. Monthly Evolution (Last 6 Months)
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        String[] monthNames = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"};
        LocalDate now = LocalDate.now();
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("YYYY-MM");
        
        // Initialize last 6 months
        for (int i = 5; i >= 0; i--) {
            LocalDate d = now.minusMonths(i);
            Map<String, Object> m = new HashMap<>();
            m.put("monthKey", d.format(fmt));
            m.put("month", monthNames[d.getMonthValue() - 1]);
            m.put("issued", 0);
            m.put("pending", 0);
            monthlyData.add(m);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> monthlyRows = entityManager.createNativeQuery(
            "SELECT month_key, " +
            "COALESCE(SUM(CASE WHEN type = 'issued' THEN 1 ELSE 0 END), 0) as issued_count, " +
            "COALESCE(SUM(CASE WHEN type = 'pending' THEN 1 ELSE 0 END), 0) as pending_count " +
            "FROM (" +
            "  /* Manual certifications */ " +
            "  SELECT TO_CHAR(date, 'YYYY-MM') as month_key, 'issued' as type FROM certifications WHERE LOWER(status) LIKE 'd_livr%'" +
            "  UNION ALL " +
            "  /* 100% completions */ " +
            "  SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM') as month_key, 'issued' as type " +
            "  FROM (" + completionQuery + ") as issued_comp" +
            "  UNION ALL " +
            "  /* All enrollments not finished count as pending for the current month */ " +
            "  SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM') as month_key, 'pending' as type " +
            "  FROM enrollments e " +
            "  JOIN courses c ON c.id = e.course_id " +
            "  WHERE e.status = 'ACCEPTED' AND NOT EXISTS (" +
            "    SELECT 1 FROM course_progress cp2 " +
            "    WHERE cp2.apprenant_id = e.apprenant_id AND cp2.course_id = e.course_id " +
            "    AND (SELECT count(*) FROM sub_sections ss3 JOIN sections s3 ON ss3.section_id = s3.id WHERE s3.course_id = e.course_id) > 0 " +
            "    AND (CASE WHEN cp2.completed_sub_section_ids = '' THEN 0 " +
            "              ELSE (LENGTH(cp2.completed_sub_section_ids) - LENGTH(REPLACE(cp2.completed_sub_section_ids, ',', '')) + 1) END) >= " +
            "        (SELECT count(*) FROM sub_sections ss4 JOIN sections s4 ON ss4.section_id = s4.id WHERE s4.course_id = e.course_id)" +
            "    AND (c.final_exam_id IS NULL OR c.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = e.apprenant_id AND qr.course_id = e.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(c.final_exam_id AS VARCHAR))))" +
            "  )" +
            ") as t " +
            "WHERE month_key >= TO_CHAR(CURRENT_DATE - INTERVAL '6 months', 'YYYY-MM') " +
            "GROUP BY month_key"
        ).getResultList();

        for (Object[] row : monthlyRows) {
            String key = (row[0] != null) ? row[0].toString() : "";
            for (Map<String, Object> m : monthlyData) {
                if (m.get("monthKey").equals(key)) {
                    m.put("issued", ((Number) row[1]).intValue());
                    m.put("pending", ((Number) row[2]).intValue());
                }
            }
        }
        result.put("monthlyData", monthlyData);

        // 3. Distribution by Specialty
        @SuppressWarnings("unchecked")
        List<Object[]> distRows = entityManager.createNativeQuery(
            "SELECT s.nom, COUNT(*) FROM (" +
            "  SELECT apprenant_id, course_id FROM (" + completionQuery + ") as c1" +
            "  UNION " +
            "  SELECT a.id as apprenant_id, 0 as course_id FROM certifications cert JOIN apprenants a ON LOWER(TRIM(a.nom || ' ' || a.prenom)) = LOWER(TRIM(cert.learner_name))" +
            ") as certs " +
            "JOIN apprenants a2 ON a2.id = certs.apprenant_id " +
            "JOIN specialites s ON a2.specialite_id = s.id " +
            "GROUP BY s.nom"
        ).getResultList();

        List<Map<String, Object>> distributionData = new ArrayList<>();
        for (Object[] row : distRows) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", row[0]);
            m.put("value", row[1]);
            distributionData.add(m);
        }
        result.put("distributionData", distributionData);

        // 4. Recent Certifications (Virtual + Real)
        @SuppressWarnings("unchecked")
        List<Object[]> recentRows = entityManager.createNativeQuery(
            "SELECT learner_name, course_title, cert_date, cert_score, cert_status FROM (" +
            "  /* 1. Formal records */ " +
            "  SELECT learner_name, title as course_title, date as cert_date, score as cert_score, status as cert_status FROM certifications WHERE LOWER(status) LIKE 'd_livr%'" +
            "  UNION ALL " +
            "  /* 2. Finished via progress (100%) */ " +
            "  SELECT a.nom || ' ' || a.prenom, co.title, CURRENT_DATE, " +
            "  COALESCE((SELECT score FROM quiz_results qr WHERE qr.apprenant_id = a.id AND qr.course_id = co.id ORDER BY attempted_at DESC LIMIT 1), 0), 'Délivré' " +
            "  FROM course_progress cp " +
            "  JOIN apprenants a ON a.id = cp.apprenant_id " +
            "  JOIN courses co ON co.id = cp.course_id " +
            "  JOIN enrollments e ON e.apprenant_id = a.id AND e.course_id = co.id " +
            "  WHERE e.status = 'ACCEPTED' AND cp.completed_sub_section_ids IS NOT NULL AND cp.completed_sub_section_ids != '' " +
            "  AND (SELECT count(ss.id) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = co.id) > 0 " +
            "  AND (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) >= " +
            "      (SELECT count(*) FROM sub_sections ss2 JOIN sections s2 ON ss2.section_id = s2.id WHERE s2.course_id = co.id)" +
            "  AND (co.final_exam_id IS NULL OR co.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = a.id AND qr.course_id = co.id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(co.final_exam_id AS VARCHAR)))) " +
            "  AND NOT EXISTS (SELECT 1 FROM certifications WHERE learner_name = (a.nom || ' ' || a.prenom) AND title = co.title) " +
            "  UNION ALL " +
            "  /* 3. Active enrollments (Pending) - Use processed date */ " +
            "  SELECT a.nom || ' ' || a.prenom, co.title, CAST(COALESCE(e.processed_at, e.requested_at, CURRENT_TIMESTAMP) AS DATE), 0, 'En attente' " +
            "  FROM enrollments e " +
            "  JOIN apprenants a ON a.id = e.apprenant_id " +
            "  JOIN courses co ON co.id = e.course_id " +
            "  WHERE e.status = 'ACCEPTED' AND NOT EXISTS (" +
            "    SELECT 1 FROM course_progress cp2 " +
            "    WHERE cp2.apprenant_id = e.apprenant_id AND cp2.course_id = e.course_id " +
            "    AND (SELECT count(*) FROM sub_sections ss3 JOIN sections s3 ON ss3.section_id = s3.id WHERE s3.course_id = co.id) > 0 " +
            "    AND (CASE WHEN cp2.completed_sub_section_ids = '' OR cp2.completed_sub_section_ids IS NULL THEN 0 " +
            "              ELSE (LENGTH(cp2.completed_sub_section_ids) - LENGTH(REPLACE(cp2.completed_sub_section_ids, ',', '')) + 1) END) >= " +
            "        (SELECT count(*) FROM sub_sections ss4 JOIN sections s4 ON ss4.section_id = s4.id WHERE s4.course_id = co.id) " +
            "    AND (co.final_exam_id IS NULL OR co.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr2 WHERE qr2.apprenant_id = e.apprenant_id AND qr2.course_id = co.id AND qr2.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(co.final_exam_id AS VARCHAR))))" +
            "  )" +
            ") as t ORDER BY cert_date DESC LIMIT 10"
        ).getResultList();

        List<Map<String, Object>> recentCerts = new ArrayList<>();
        for (Object[] row : recentRows) {
            Map<String, Object> m = new HashMap<>();
            m.put("learnerName", row[0]);
            m.put("title", row[1]);
            m.put("date", row[2]);
            m.put("score", row[3]);
            m.put("status", row[4]);
            recentCerts.add(m);
        }
        result.put("recentCertifications", recentCerts);

        return result;
    }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalyticsStats() {
        Map<String, Object> result = new HashMap<>();

        // 1. KPIs
        // Success rate based on COMPLETION: (Enrollments with 100% progress) / (Total Accepted Enrollments)
        String successRateQuery = 
            "SELECT COALESCE(CAST(COUNT(CASE WHEN (total_ss > 0 AND done_ss >= total_ss AND (final_exam_id IS NULL OR exam_enabled = false OR has_passed_exam = true)) THEN 1 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 0) " +
            "FROM (" +
            "  SELECT e.id, " +
            "  (SELECT count(ss.id) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = e.course_id) as total_ss, " +
            "  (SELECT CASE WHEN cp.completed_sub_section_ids = '' OR cp.completed_sub_section_ids IS NULL THEN 0 " +
            "               ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END " +
            "   FROM course_progress cp WHERE cp.apprenant_id = e.apprenant_id AND cp.course_id = e.course_id LIMIT 1) as done_ss, " +
            "  (SELECT c.final_exam_id FROM courses c WHERE c.id = e.course_id) as final_exam_id, " +
            "  (SELECT c.exam_enabled FROM courses c WHERE c.id = e.course_id) as exam_enabled, " +
            "  EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = e.apprenant_id AND qr.course_id = e.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST((SELECT c2.final_exam_id FROM courses c2 WHERE c2.id = e.course_id) AS VARCHAR))) as has_passed_exam " +
            "  FROM enrollments e WHERE e.status = 'ACCEPTED'" +
            ") as t";

        Number successRate = (Number) entityManager.createNativeQuery(successRateQuery).getSingleResult();

        // 100% progress query (same as certifications)
        String completionQuery = 
            "SELECT cp.apprenant_id " +
            "FROM course_progress cp " +
            "JOIN enrollments e ON e.apprenant_id = cp.apprenant_id AND e.course_id = cp.course_id " +
            "JOIN courses co ON co.id = cp.course_id " +
            "WHERE e.status = 'ACCEPTED' " +
            "AND cp.completed_sub_section_ids IS NOT NULL AND cp.completed_sub_section_ids != '' " +
            "AND (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) > 0 " +
            "AND (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) >= " +
            "    (SELECT count(*) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = cp.course_id) " +
            "AND (co.final_exam_id IS NULL OR co.exam_enabled = false OR EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = cp.apprenant_id AND qr.course_id = cp.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST(co.final_exam_id AS VARCHAR))))";

        Number totalCertified = (Number) entityManager.createNativeQuery(
            "SELECT COUNT(DISTINCT id) FROM (" +
            "  SELECT apprenant_id as id FROM (" + completionQuery + ") as c" +
            "  UNION " +
            "  SELECT a.id FROM certifications cert JOIN apprenants a ON LOWER(TRIM(a.nom || ' ' || a.prenom)) = LOWER(TRIM(cert.learner_name))" +
            "  UNION " +
            "  SELECT apprenant_id FROM quiz_results WHERE (quiz_id = 'final_exam' OR quiz_id LIKE 'final%') AND passed = true" +
            ") as t"
        ).getSingleResult();

        Number generalAverage = (Number) entityManager.createNativeQuery(
            "SELECT COALESCE(AVG(score), 0) FROM quiz_results"
        ).getSingleResult();

        result.put("globalSuccessRate", Math.round(successRate.doubleValue() * 10) / 10.0);
        result.put("totalCertified", totalCertified.intValue());
        result.put("generalAverage", Math.round(generalAverage.doubleValue() * 10) / 10.0);

        // 2. Specialty Data (Based on Completion Rate per Specialty)
        @SuppressWarnings("unchecked")
        List<Object[]> specRows = entityManager.createNativeQuery(
            "SELECT speciality_name, " +
            "COALESCE(CAST(COUNT(CASE WHEN (total_ss > 0 AND done_ss >= total_ss AND (final_exam_id IS NULL OR exam_enabled = false OR has_passed_exam = true)) THEN 1 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 0) as success_rate, " +
            "COUNT(DISTINCT learner_id) as total_students " +
            "FROM (" +
            "  SELECT s.nom as speciality_name, a.id as learner_id, e.id as enrollment_id, " +
            "  (SELECT count(ss.id) FROM sub_sections ss JOIN sections s2 ON ss.section_id = s2.id WHERE s2.course_id = e.course_id) as total_ss, " +
            "  (SELECT CASE WHEN cp.completed_sub_section_ids = '' OR cp.completed_sub_section_ids IS NULL THEN 0 " +
            "               ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END " +
            "   FROM course_progress cp WHERE cp.apprenant_id = e.apprenant_id AND cp.course_id = e.course_id LIMIT 1) as done_ss, " +
            "  (SELECT c.final_exam_id FROM courses c WHERE c.id = e.course_id) as final_exam_id, " +
            "  (SELECT c.exam_enabled FROM courses c WHERE c.id = e.course_id) as exam_enabled, " +
            "  EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = e.apprenant_id AND qr.course_id = e.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST((SELECT c3.final_exam_id FROM courses c3 WHERE c3.id = e.course_id) AS VARCHAR))) as has_passed_exam " +
            "  FROM specialites s " +
            "  JOIN apprenants a ON a.specialite_id = s.id " +
            "  JOIN enrollments e ON e.apprenant_id = a.id " +
            "  WHERE e.status = 'ACCEPTED'" +
            ") as t " +
            "GROUP BY speciality_name"
        ).getResultList();

        List<Map<String, Object>> specialityData = new ArrayList<>();
        for (Object[] row : specRows) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", row[0]);
            m.put("success", Math.round(((Number) row[1]).doubleValue()));
            m.put("total", ((Number) row[2]).intValue());
            specialityData.add(m);
        }
        result.put("specialityData", specialityData);

        // 3. Monthly Progress (Evolution of completion rate)
        @SuppressWarnings("unchecked")
        List<Object[]> monthlyRows = entityManager.createNativeQuery(
            "SELECT TO_CHAR(COALESCE(processed_at, requested_at), 'YYYY-MM') as month_key, " +
            "COALESCE(CAST(COUNT(CASE WHEN (total_ss > 0 AND done_ss >= total_ss AND (final_exam_id IS NULL OR exam_enabled = false OR has_passed_exam = true)) THEN 1 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 0) as rate " +
            "FROM (" +
            "  SELECT e.processed_at, e.requested_at, " +
            "  (SELECT count(ss.id) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = e.course_id) as total_ss, " +
            "  (SELECT CASE WHEN cp.completed_sub_section_ids = '' OR cp.completed_sub_section_ids IS NULL THEN 0 " +
            "               ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END " +
            "   FROM course_progress cp WHERE cp.apprenant_id = e.apprenant_id AND cp.course_id = e.course_id LIMIT 1) as done_ss, " +
            "  (SELECT c.final_exam_id FROM courses c WHERE c.id = e.course_id) as final_exam_id, " +
            "  (SELECT c.exam_enabled FROM courses c WHERE c.id = e.course_id) as exam_enabled, " +
            "  EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = e.apprenant_id AND qr.course_id = e.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST((SELECT c4.final_exam_id FROM courses c4 WHERE c4.id = e.course_id) AS VARCHAR))) as has_passed_exam " +
            "  FROM enrollments e WHERE e.status = 'ACCEPTED'" +
            ") as t " +
            "WHERE COALESCE(processed_at, requested_at) >= CURRENT_DATE - INTERVAL '6 months' " +
            "GROUP BY month_key " +
            "ORDER BY month_key ASC"
        ).getResultList();

        List<Map<String, Object>> monthlyProgressData = new ArrayList<>();
        String[] monthNames = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"};
        for (Object[] row : monthlyRows) {
            Map<String, Object> m = new HashMap<>();
            String key = row[0].toString();
            int monthIdx = Integer.parseInt(key.split("-")[1]) - 1;
            m.put("month", monthNames[monthIdx]);
            m.put("rate", Math.round(((Number) row[1]).doubleValue()));
            monthlyProgressData.add(m);
        }
        
        // If empty, add at least current month with 0
        if (monthlyProgressData.isEmpty()) {
            Map<String, Object> m = new HashMap<>();
            m.put("month", monthNames[LocalDate.now().getMonthValue() - 1]);
            m.put("rate", 0);
            monthlyProgressData.add(m);
        }
        result.put("monthlyProgressData", monthlyProgressData);

        // 4. Pie Distribution (Based on progress)
        String statsBaseQuery = 
            "SELECT " +
            "COUNT(CASE WHEN (total_ss > 0 AND done_ss >= total_ss AND (final_exam_id IS NULL OR exam_enabled = false OR has_passed_exam = true)) THEN 1 END) as success, " +
            "COUNT(CASE WHEN (total_ss > 0 AND (done_ss > 0 OR (done_ss = 0 AND has_passed_exam = true)) AND (done_ss < total_ss OR (exam_enabled = true AND has_passed_exam = false))) THEN 1 END) as ongoing, " +
            "COUNT(CASE WHEN (total_ss = 0 OR (done_ss = 0 AND has_passed_exam = false)) THEN 1 END) as started " +
            "FROM (" +
            "  SELECT " +
            "  (SELECT count(ss.id) FROM sub_sections ss JOIN sections s ON ss.section_id = s.id WHERE s.course_id = e.course_id) as total_ss, " +
            "  (SELECT CASE WHEN cp.completed_sub_section_ids = '' OR cp.completed_sub_section_ids IS NULL THEN 0 " +
            "               ELSE (LENGTH(cp.completed_sub_section_ids) - LENGTH(REPLACE(cp.completed_sub_section_ids, ',', '')) + 1) END " +
            "   FROM course_progress cp WHERE cp.apprenant_id = e.apprenant_id AND cp.course_id = e.course_id LIMIT 1) as done_ss, " +
            "  (SELECT c.final_exam_id FROM courses c WHERE c.id = e.course_id) as final_exam_id, " +
            "  (SELECT c.exam_enabled FROM courses c WHERE c.id = e.course_id) as exam_enabled, " +
            "  EXISTS (SELECT 1 FROM quiz_results qr WHERE qr.apprenant_id = e.apprenant_id AND qr.course_id = e.course_id AND qr.passed = true AND (qr.quiz_id = 'final_exam' OR qr.quiz_id = CAST((SELECT c5.final_exam_id FROM courses c5 WHERE c5.id = e.course_id) AS VARCHAR))) as has_passed_exam " +
            "  FROM enrollments e WHERE e.status = 'ACCEPTED'" +
            ") as t";

        Object[] stats = (Object[]) entityManager.createNativeQuery(statsBaseQuery).getSingleResult();
        
        List<Map<String, Object>> pieData = new ArrayList<>();
        Map<String, Object> r1 = new HashMap<>(); r1.put("name", "Réussite (100%)"); r1.put("value", ((Number) stats[0]).intValue());
        Map<String, Object> r2 = new HashMap<>(); r2.put("name", "En cours"); r2.put("value", ((Number) stats[1]).intValue());
        Map<String, Object> r3 = new HashMap<>(); r3.put("name", "À commencer"); r3.put("value", ((Number) stats[2]).intValue());
        
        pieData.add(r1);
        pieData.add(r2);
        pieData.add(r3);
        result.put("pieData", pieData);

        return result;
    }
}
