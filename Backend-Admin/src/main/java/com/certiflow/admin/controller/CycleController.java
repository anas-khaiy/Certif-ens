package com.certiflow.admin.controller;

import com.certiflow.admin.model.Cycle;
import com.certiflow.admin.service.CycleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cycles")
public class CycleController {

    private final CycleService cycleService;

    public CycleController(CycleService cycleService) {
        this.cycleService = cycleService;
    }

    @GetMapping
    public List<Cycle> getAllCycles() {
        return cycleService.getAllCycles();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cycle> getCycleById(@PathVariable Long id) {
        return ResponseEntity.ok(cycleService.getCycleById(id));
    }

    @PostMapping
    public Cycle createCycle(@RequestBody Cycle cycle) {
        return cycleService.saveCycle(cycle);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cycle> updateCycle(@PathVariable Long id, @RequestBody Cycle cycle) {
        return ResponseEntity.ok(cycleService.updateCycle(id, cycle));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCycle(@PathVariable Long id) {
        cycleService.deleteCycle(id);
        return ResponseEntity.noContent().build();
    }
}
