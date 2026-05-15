package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.EncadrementTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EncadrementTaskRepository extends JpaRepository<EncadrementTask, Long> {
}
