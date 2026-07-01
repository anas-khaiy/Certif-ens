package com.certiflow.coordinateur.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationCode(String toEmail, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Code de réinitialisation de mot de passe");
            helper.setFrom("Certif.fun <noreply@certif.fun>");
            String html = "Votre code de réinitialisation est : <b>" + code + "</b>";
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendReportEmail(String toEmail, String apprenantNom, String depotLabel, String downloadLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Rapport PFE - " + apprenantNom + " (" + depotLabel + ")");
            helper.setFrom("Certif.fun <noreply@certif.fun>");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                            <span style="color: white; font-size: 24px; font-weight: bold;">C</span>
                        </div>
                        <h2 style="color: #1e293b; margin: 0;">Certif.fun</h2>
                    </div>
                    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">Bonjour,</p>
                        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                            Veuillez trouver ci-joint le rapport <strong>%s</strong>
                            de l'apprenant <strong>%s</strong>.
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s"
                               style="display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                                Telecharger le rapport
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
                            Ce lien vous permet de telecharger le rapport PDF depose par l'apprenant.
                        </p>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
                        Cet email a ete envoye automatiquement depuis la plateforme Certif.fun.
                    </p>
                </div>
                """.formatted(depotLabel, apprenantNom, downloadLink);

            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send report email", e);
        }
    }
}
