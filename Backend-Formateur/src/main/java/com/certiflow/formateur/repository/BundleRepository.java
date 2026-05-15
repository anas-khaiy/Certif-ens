package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.Bundle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BundleRepository extends JpaRepository<Bundle, Long> {
    List<Bundle> findAllByOrderByIdDesc();
    List<Bundle> findAllByPublishedTrueOrderByIdDesc();
}
