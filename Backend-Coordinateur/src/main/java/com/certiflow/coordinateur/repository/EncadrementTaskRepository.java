package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.EncadrementTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EncadrementTaskRepository extends JpaRepository<EncadrementTask, Long> {
}
