package com.certiflow.admin.controller;

import com.certiflow.admin.model.Apprenant;
import com.certiflow.admin.model.Enseignant;
import com.certiflow.admin.model.Cycle;
import com.certiflow.admin.model.Formation;
import com.certiflow.admin.model.Specialite;
import com.certiflow.admin.repository.ApprenantRepository;
import com.certiflow.admin.repository.CycleRepository;
import com.certiflow.admin.repository.FormationRepository;
import com.certiflow.admin.repository.SpecialiteRepository;
import com.certiflow.admin.repository.EnseignantRepository;
import com.certiflow.admin.repository.SystemSettingRepository;
import com.certiflow.admin.service.ApprenantService;
import com.certiflow.admin.service.EnseignantService;
import com.certiflow.admin.service.RecaptchaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Inscription publique des apprenants et des formateurs.
 * Chaque inscription doit être activée par l'administrateur (paramètres) et protégée par reCAPTCHA.
 * Le compte est créé exactement comme depuis l'espace admin (mot de passe par défaut + e-mail de bienvenue).
 */
@RestController
@RequestMapping("/api/v1/public")
public class PublicRegistrationController {

    public static final String KEY_APPRENANT = "REGISTRATION_APPRENANT_ENABLED";
    public static final String KEY_FORMATEUR = "REGISTRATION_FORMATEUR_ENABLED";

    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    private final SystemSettingRepository settings;
    private final ApprenantRepository apprenantRepository;
    private final EnseignantRepository enseignantRepository;
    private final ApprenantService apprenantService;
    private final EnseignantService enseignantService;
    private final RecaptchaService recaptchaService;
    private final FormationRepository formationRepository;
    private final CycleRepository cycleRepository;
    private final SpecialiteRepository specialiteRepository;

    public PublicRegistrationController(SystemSettingRepository settings,
                                        ApprenantRepository apprenantRepository,
                                        EnseignantRepository enseignantRepository,
                                        ApprenantService apprenantService,
                                        EnseignantService enseignantService,
                                        RecaptchaService recaptchaService,
                                        FormationRepository formationRepository,
                                        CycleRepository cycleRepository,
                                        SpecialiteRepository specialiteRepository) {
        this.formationRepository = formationRepository;
        this.cycleRepository = cycleRepository;
        this.specialiteRepository = specialiteRepository;
        this.settings = settings;
        this.apprenantRepository = apprenantRepository;
        this.enseignantRepository = enseignantRepository;
        this.apprenantService = apprenantService;
        this.enseignantService = enseignantService;
        this.recaptchaService = recaptchaService;
    }

    private boolean isEnabled(String key) {
        return settings.findById(key)
                .map(s -> "true".equalsIgnoreCase(s.getSettingValue()))
                .orElse(false);
    }

    private static String clean(String v) {
        return v == null ? "" : v.trim();
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @GetMapping("/registration-settings")
    public Map<String, Boolean> registrationSettings() {
        return Map.of(
                "apprenant", isEnabled(KEY_APPRENANT),
                "formateur", isEnabled(KEY_FORMATEUR));
    }

    /** Listes déroulantes du formulaire d'inscription (formations, cycles, spécialités). */
    @GetMapping("/registration-options")
    public Map<String, Object> registrationOptions() {
        List<Map<String, Object>> formations = formationRepository.findAll().stream()
                .map(f -> Map.<String, Object>of("id", f.getId(), "nom", f.getNom()))
                .toList();
        List<Map<String, Object>> cycles = cycleRepository.findAll().stream()
                .map(c -> Map.<String, Object>of("id", c.getId(), "nom", c.getNomCycle()))
                .toList();
        List<Map<String, Object>> specialites = specialiteRepository.findAll().stream()
                .map(sp -> Map.<String, Object>of("id", sp.getId(), "nom", sp.getNom()))
                .toList();
        return Map.of("formations", formations, "cycles", cycles, "specialites", specialites);
    }

    private static Long parseId(String v) {
        try { return v == null || v.isBlank() ? null : Long.valueOf(v.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    @PostMapping("/register/apprenant")
    public ResponseEntity<Map<String, String>> registerApprenant(@RequestBody Map<String, String> body) {
        if (!isEnabled(KEY_APPRENANT)) {
            return error(HttpStatus.FORBIDDEN, "L'inscription des apprenants n'est pas disponible.");
        }
        if (!recaptchaService.verify(body.get("recaptchaToken"))) {
            return error(HttpStatus.BAD_REQUEST, "Vérification reCAPTCHA invalide. Veuillez réessayer.");
        }

        String nom = clean(body.get("nom"));
        String prenom = clean(body.get("prenom"));
        String email = clean(body.get("email")).toLowerCase();
        String cin = clean(body.get("cne")).toUpperCase();
        String sexe = clean(body.get("sexe"));
        Long formationId = parseId(body.get("formationId"));
        Long cycleId = parseId(body.get("cycleId"));
        Long specialiteId = parseId(body.get("specialiteId"));

        if (nom.isEmpty() || prenom.isEmpty() || email.isEmpty() || cin.isEmpty()
                || sexe.isEmpty() || formationId == null || cycleId == null || specialiteId == null) {
            return error(HttpStatus.BAD_REQUEST, "Tous les champs sont obligatoires.");
        }
        if (!sexe.equals("Homme") && !sexe.equals("Femme")) {
            return error(HttpStatus.BAD_REQUEST, "Sexe invalide.");
        }
        Formation formation = formationRepository.findById(formationId).orElse(null);
        Cycle cycle = cycleRepository.findById(cycleId).orElse(null);
        Specialite specialite = specialiteRepository.findById(specialiteId).orElse(null);
        if (formation == null || cycle == null || specialite == null) {
            return error(HttpStatus.BAD_REQUEST, "Formation, cycle ou spécialité invalide.");
        }
        if (!EMAIL.matcher(email).matches()) {
            return error(HttpStatus.BAD_REQUEST, "Adresse e-mail invalide.");
        }
        if (apprenantRepository.existsByEmail(email)) {
            return error(HttpStatus.CONFLICT, "Cette adresse e-mail est déjà utilisée.");
        }
        if (apprenantRepository.existsByCin(cin) || apprenantRepository.existsByCin(cin.toLowerCase())) {
            return error(HttpStatus.CONFLICT, "Ce CNE est déjà enregistré.");
        }

        Apprenant a = new Apprenant();
        a.setNom(nom);
        a.setPrenom(prenom);
        a.setEmail(email);
        a.setCin(cin);
        a.setSexe(sexe);
        a.setFormation(formation);
        a.setCycle(cycle);
        a.setSpecialite(specialite);
        // Mot de passe par défaut = CNE, envoyé par e-mail (comme l'ajout par l'admin)
        apprenantService.saveApprenant(a);

        return ResponseEntity.ok(Map.of("message",
                "Inscription réussie. Vérifiez votre boîte e-mail pour vous connecter."));
    }

    @PostMapping("/register/formateur")
    public ResponseEntity<Map<String, String>> registerFormateur(@RequestBody Map<String, String> body) {
        if (!isEnabled(KEY_FORMATEUR)) {
            return error(HttpStatus.FORBIDDEN, "L'inscription des formateurs n'est pas disponible.");
        }
        if (!recaptchaService.verify(body.get("recaptchaToken"))) {
            return error(HttpStatus.BAD_REQUEST, "Vérification reCAPTCHA invalide. Veuillez réessayer.");
        }

        String nom = clean(body.get("nom"));
        String prenom = clean(body.get("prenom"));
        String email = clean(body.get("email")).toLowerCase();
        Long specialiteId = parseId(body.get("specialiteId"));

        if (nom.isEmpty() || prenom.isEmpty() || email.isEmpty() || specialiteId == null) {
            return error(HttpStatus.BAD_REQUEST, "Tous les champs sont obligatoires.");
        }
        Specialite specialite = specialiteRepository.findById(specialiteId).orElse(null);
        if (specialite == null) {
            return error(HttpStatus.BAD_REQUEST, "Spécialité invalide.");
        }
        if (!EMAIL.matcher(email).matches()) {
            return error(HttpStatus.BAD_REQUEST, "Adresse e-mail invalide.");
        }
        if (enseignantRepository.existsByEmail(email)) {
            return error(HttpStatus.CONFLICT, "Cette adresse e-mail est déjà utilisée.");
        }

        Enseignant e = new Enseignant();
        e.setNom(nom);
        e.setPrenom(prenom);
        e.setEmail(email);
        e.setSpecialite(specialite);
        // Mot de passe par défaut = e-mail, envoyé par e-mail (comme l'ajout par l'admin)
        enseignantService.saveEnseignant(e);

        return ResponseEntity.ok(Map.of("message",
                "Inscription réussie. Vérifiez votre boîte e-mail pour vous connecter."));
    }
}
