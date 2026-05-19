package com.certiflow.formateur.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a password-reset OTP email with an HTML template.
     */
    public void sendPasswordResetEmail(String toEmail, String prenom, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🔐 Certif.fun — Réinitialisation de votre mot de passe");
            helper.setFrom("Certif.fun <noreply@certif.fun>");

            String html = buildEmailHtml(prenom, code);
            helper.setText(html, true); // true = isHtml

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email de réinitialisation", e);
        }
    }

    private String buildEmailHtml(String prenom, String code) {
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Réinitialisation du mot de passe</title>
                </head>
                <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="560" cellpadding="0" cellspacing="0"
                                    style="background:linear-gradient(135deg,#1e293b 0%%,#0f172a 100%%);border-radius:20px;
                                           border:1px solid rgba(99,102,241,0.3);overflow:hidden;max-width:560px;width:100%%;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                                            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                                                🎓 Certif.fun
                                            </h1>
                                            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;font-weight:500;">
                                                Plateforme Éducative
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Body -->
                                    <tr>
                                        <td style="padding:40px;">
                                            <p style="color:#94a3b8;font-size:15px;margin:0 0 8px;">Bonjour,
                                                <strong style="color:#e2e8f0;">%s</strong> 👋
                                            </p>
                                            <p style="color:#94a3b8;font-size:15px;margin:0 0 32px;line-height:1.6;">
                                                Vous avez demandé la réinitialisation de votre mot de passe.
                                                Voici votre code de vérification à usage unique, valable <strong style="color:#e2e8f0;">10 minutes</strong> :
                                            </p>

                                            <!-- OTP Code Box -->
                                            <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15));
                                                        border:2px solid rgba(99,102,241,0.4);border-radius:16px;
                                                        padding:28px;text-align:center;margin-bottom:32px;">
                                                <p style="color:#94a3b8;font-size:13px;font-weight:700;
                                                          text-transform:uppercase;letter-spacing:0.2em;margin:0 0 12px;">
                                                    Votre code de vérification
                                                </p>
                                                <span style="font-size:48px;font-weight:900;letter-spacing:0.3em;
                                                             color:#a5b4fc;font-family:monospace;display:block;">
                                                    %s
                                                </span>
                                            </div>

                                            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
                                                        border-radius:12px;padding:16px;margin-bottom:32px;">
                                                <p style="color:#f87171;font-size:13px;margin:0;line-height:1.6;">
                                                    ⚠️ <strong>Si vous n'avez pas effectué cette demande</strong>,
                                                    ignorez cet email. Votre compte reste sécurisé.
                                                </p>
                                            </div>

                                            <p style="color:#475569;font-size:13px;margin:0;line-height:1.6;text-align:center;">
                                                Ce code expire automatiquement après 10 minutes.<br>
                                                Pour des raisons de sécurité, ne partagez jamais ce code.
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding:24px 40px;border-top:1px solid rgba(99,102,241,0.2);text-align:center;">
                                            <p style="color:#334155;font-size:12px;margin:0;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">
                                                © 2026 Certif.fun — Tous droits réservés
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(prenom, code);
    }
}
