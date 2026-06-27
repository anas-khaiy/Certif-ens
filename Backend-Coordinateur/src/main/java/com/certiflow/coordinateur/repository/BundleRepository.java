package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.Bundle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BundleRepository extends JpaRepository<Bundle, Long> {
    List<Bundle> findAllByOrderByIdDesc();
    List<Bundle> findAllByPublishedTrueOrderByIdDesc();
}
