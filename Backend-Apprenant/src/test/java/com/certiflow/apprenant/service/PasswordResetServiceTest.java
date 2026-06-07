package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.repository.ApprenantRepository;
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
    private ApprenantRepository apprenantRepository;

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
    void testGenerateAndSendCode_ApprenantNotFound_ThrowsException() {
        when(apprenantRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.generateAndSendCode("unknown@test.com"));
        
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Aucun compte trouvé"));
    }

    @Test
    void testGenerateAndSendCode_ApprenantFound_SendsEmail() {
        Apprenant apprenant = new Apprenant();
        apprenant.setEmail("apprenant@test.com");
        apprenant.setPrenom("Ali");

        when(apprenantRepository.findByEmail("apprenant@test.com")).thenReturn(Optional.of(apprenant));

        assertDoesNotThrow(() -> passwordResetService.generateAndSendCode("apprenant@test.com"));

        verify(emailService, times(1)).sendPasswordResetEmail(eq("apprenant@test.com"), eq("Ali"), anyString());
    }

    @Test
    void testGenerateAndSendCode_NormalizesEmail() {
        Apprenant apprenant = new Apprenant();
        apprenant.setEmail("apprenant@test.com");
        apprenant.setPrenom("Ali");

        when(apprenantRepository.findByEmail("apprenant@test.com")).thenReturn(Optional.of(apprenant));

        assertDoesNotThrow(() -> passwordResetService.generateAndSendCode(" APPRENANT@TEST.COM "));

        verify(emailService, times(1)).sendPasswordResetEmail(eq("apprenant@test.com"), eq("Ali"), anyString());
    }

    @Test
    void testVerifyCode_NoCodeRequested_ThrowsException() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.verifyCode("apprenant@test.com", "123456"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Aucun code de réinitialisation trouvé"));
    }

    @Test
    void testVerifyCode_IncorrectCode_ThrowsException() {
        Apprenant apprenant = new Apprenant();
        apprenant.setEmail("apprenant@test.com");
        when(apprenantRepository.findByEmail(anyString())).thenReturn(Optional.of(apprenant));
        
        passwordResetService.generateAndSendCode("apprenant@test.com");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.verifyCode("apprenant@test.com", "000000"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Code incorrect"));
    }

    @Test
    void testResetPassword_ApprenantNotFoundAfterVerification_ThrowsException() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.resetPassword("apprenant@test.com", "123456", "NewPass123"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void testResetPassword_WrongCode_ThrowsException() {
        Apprenant apprenant = new Apprenant();
        apprenant.setEmail("apprenant@test.com");
        when(apprenantRepository.findByEmail(anyString())).thenReturn(Optional.of(apprenant));
        
        passwordResetService.generateAndSendCode("apprenant@test.com");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.resetPassword("apprenant@test.com", "wrong", "NewPass123"));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }
    
    @Test
    void testVerifyCode_NormalizesEmailAndTrimsCode() {
        Apprenant apprenant = new Apprenant();
        apprenant.setEmail("apprenant@test.com");
        when(apprenantRepository.findByEmail(anyString())).thenReturn(Optional.of(apprenant));
        
        passwordResetService.generateAndSendCode("apprenant@test.com");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, 
                () -> passwordResetService.verifyCode(" APPRENANT@TEST.COM ", " 000000 "));
        
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Code incorrect"));
    }
}
