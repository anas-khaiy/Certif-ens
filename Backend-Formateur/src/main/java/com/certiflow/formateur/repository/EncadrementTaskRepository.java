package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.EncadrementTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EncadrementTaskRepository extends JpaRepository<EncadrementTask, Long> {
}
