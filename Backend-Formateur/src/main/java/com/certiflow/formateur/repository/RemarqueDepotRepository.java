package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.RemarqueDepot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RemarqueDepotRepository extends JpaRepository<RemarqueDepot, Long> {
    List<RemarqueDepot> findByDepotPfeIdOrderByDateRemarqueDesc(Long depotId);
}
