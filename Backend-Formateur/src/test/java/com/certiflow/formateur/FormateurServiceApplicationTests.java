package com.certiflow.formateur;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@Disabled("Disabled to run mock-only unit tests without database dependency")
@SpringBootTest
@ActiveProfiles("test")
class FormateurServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
