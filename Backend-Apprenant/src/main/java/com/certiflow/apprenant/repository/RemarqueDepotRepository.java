package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.RemarqueDepot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RemarqueDepotRepository extends JpaRepository<RemarqueDepot, Long> {
    List<RemarqueDepot> findByDepotPfeId(Long depotId);
}
