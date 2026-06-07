package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.repository.EnseignantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PasswordResetServiceTest {

    @Mock
    private EnseignantRepository enseignantRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGenerateAndSendCode_EnseignantNotFound_ThrowsException() {
        when(enseignantRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.generateAndSendCode("unknown@test.com"));
        
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Aucun compte formateur trouvé"));
    }

    @Test
    void testGenerateAndSendCode_EnseignantFound_SendsEmail() {
        Enseignant enseignant = new Enseignant();
        enseignant.setEmail("formateur@test.com");
        enseignant.setPrenom("Marie");

        when(enseignantRepository.findByEmail("formateur@test.com")).thenReturn(Optional.of(enseignant));

        assertDoesNotThrow(() -> passwordResetService.generateAndSendCode("formateur@test.com"));

        verify(emailService, times(1)).sendPasswordResetEmail(eq("formateur@test.com"), eq("Marie"), anyString());
    }

    @Test
    void testGenerateAndSendCode_NormalizesEmail() {
        Enseignant enseignant = new Enseignant();
        enseignant.setEmail("formateur@test.com");
        enseignant.setPrenom("Marie");

        when(enseignantRepository.findByEmail("formateur@test.com")).thenReturn(Optional.of(enseignant));

        assertDoesNotThrow(() -> passwordResetService.generateAndSendCode(" FORMATEUR@TEST.COM "));

        verify(emailService, times(1)).sendPasswordResetEmail(eq("formateur@test.com"), eq("Marie"), anyString());
    }

    @Test
    void testVerifyCode_NoCodeRequested_ThrowsException() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.verifyCode("formateur@test.com", "123456"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Aucun code de réinitialisation trouvé"));
    }

    @Test
    void testVerifyCode_IncorrectCode_ThrowsException() {
        Enseignant enseignant = new Enseignant();
        enseignant.setEmail("formateur@test.com");
        when(enseignantRepository.findByEmail(anyString())).thenReturn(Optional.of(enseignant));
        
        passwordResetService.generateAndSendCode("formateur@test.com");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.verifyCode("formateur@test.com", "000000"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Code incorrect"));
    }

    @Test
    void testResetPassword_EnseignantNotFoundAfterVerification_ThrowsException() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.resetPassword("formateur@test.com", "123456", "NewPass123"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void testResetPassword_WrongCode_ThrowsException() {
        Enseignant enseignant = new Enseignant();
        enseignant.setEmail("formateur@test.com");
        when(enseignantRepository.findByEmail(anyString())).thenReturn(Optional.of(enseignant));
        
        passwordResetService.generateAndSendCode("formateur@test.com");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.resetPassword("formateur@test.com", "wrong", "NewPass123"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }
    
    @Test
    void testVerifyCode_NormalizesEmailAndTrimsCode() {
        Enseignant enseignant = new Enseignant();
        enseignant.setEmail("formateur@test.com");
        when(enseignantRepository.findByEmail(anyString())).thenReturn(Optional.of(enseignant));
        
        passwordResetService.generateAndSendCode("formateur@test.com");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.verifyCode(" FORMATEUR@TEST.COM ", " 000000 "));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Code incorrect"));
    }
}
