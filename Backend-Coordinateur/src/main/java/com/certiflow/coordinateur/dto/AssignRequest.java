package com.certiflow.coordinateur.dto;

import java.util.List;

public class AssignRequest {
    private Long enseignantId;
    private List<Long> apprenantIds;

    public Long getEnseignantId() {
        return enseignantId;
    }

    public void setEnseignantId(Long enseignantId) {
        this.enseignantId = enseignantId;
    }

    public List<Long> getApprenantIds() {
        return apprenantIds;
    }

    public void setApprenantIds(List<Long> apprenantIds) {
        this.apprenantIds = apprenantIds;
    }
}
