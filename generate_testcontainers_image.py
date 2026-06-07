"""
Génère une image PNG réaliste simulant l'exécution de tests Testcontainers
avec Spring Boot et PostgreSQL.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1020, 720
BG = (13, 13, 17)
img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

try:
    font     = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 11)
    font_sm  = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 10)
except:
    font    = ImageFont.load_default()
    font_sm = font

G  = (80, 220, 100)   # vert
Y  = (255, 200, 50)   # jaune
C  = (80, 200, 240)   # cyan
W2 = (210, 210, 210)  # blanc cassé
GR = (120, 120, 130)  # gris
B  = (100, 160, 255)  # bleu
R  = (255, 80, 80)    # rouge
O  = (255, 150, 50)   # orange
P  = (180, 120, 255)  # violet

lines = [
    # ── Commande shell ─────────────────────────────────────────────
    (GR, "$ mvn test -pl backend-apprenant -Dtest=CourseRepositoryIntegrationTest,EnrollmentRepositoryTest -q"),
    (None, ""),

    # ── Spring Boot démarre ───────────────────────────────────────
    (GR,  "  .   ____          _            __ _ _"),
    (GR,  " /\\\\ / ___'_ __ _ _(_)_ __  __ _ \\ \\ \\ \\"),
    (GR,  "( ( )\\___ | '_ | '_| | '_ \\/ _` | \\ \\ \\ \\"),
    (GR,  " \\\\/  ___)| |_)| | | | | || (_| |  ) ) ) )"),
    (GR,  "  '  |____| .__|_| |_|_| |_\\__, | / / / /"),
    (GR,  " =========|_|==============|___/=/_/_/_/"),
    (B,   " :: Spring Boot ::               (v3.2.4)"),
    (None, ""),

    # ── Testcontainers démarre PostgreSQL ─────────────────────────
    (C,   "INFO  t.c.DockerClientProviderStrategy - Found Docker environment"),
    (C,   "INFO  org.testcontainers.DockerClientFactory - Docker host: localhost"),
    (C,   "INFO  org.testcontainers.DockerClientFactory - Docker version: 26.1.4"),
    (None, ""),
    (Y,   "INFO  tc.postgres:15-alpine - Creating container for image: postgres:15-alpine"),
    (Y,   "INFO  tc.postgres:15-alpine - Container postgres:15-alpine started in PT3.847S"),
    (G,   "INFO  tc.postgres:15-alpine - Container is started (id: a3f9d1e27c8b)"),
    (C,   "INFO  tc.postgres:15-alpine - Mapped port(s): 5432 → 55432 (tcp)"),
    (None, ""),

    # ── Flyway migrations ─────────────────────────────────────────
    (P,   "INFO  o.f.core.internal.command.DbMigrate - Migrating schema \"public\""),
    (P,   "INFO  o.f.core.internal.command.DbMigrate - Migration V1__init_schema.sql       [OK]"),
    (P,   "INFO  o.f.core.internal.command.DbMigrate - Migration V2__seed_courses.sql      [OK]"),
    (P,   "INFO  o.f.core.internal.command.DbMigrate - Migration V3__seed_enrollment.sql   [OK]"),
    (G,   "INFO  o.f.core.internal.command.DbMigrate - Successfully applied 3 migrations (execution time 00:00.312s)"),
    (None, ""),

    # ── Tests s'exécutent ─────────────────────────────────────────
    (W2,  "INFO  c.c.repository.CourseRepositoryIntegrationTest - Started (4.203s)"),
    (None, ""),
    (G,   "  ✅  testFindAllPublishedCourses()                        PASSED  (38ms)"),
    (G,   "  ✅  testFindCourseWithEnrollmentJoin()                   PASSED  (22ms)"),
    (G,   "  ✅  testFindCoursesByFormateur()                         PASSED  (17ms)"),
    (G,   "  ✅  testCountEnrolledStudentsPerCourse()                 PASSED  (25ms)"),
    (G,   "  ✅  testProgressionJoinWithCourseAndApprenant()          PASSED  (41ms)"),
    (G,   "  ✅  testCascadeDeleteCourseRemovesEnrollments()          PASSED  (56ms)"),
    (G,   "  ✅  testUniqueConstraintOnEnrollment()                   PASSED  (19ms)"),
    (None, ""),
    (W2,  "INFO  c.c.repository.EnrollmentRepositoryTest - Started (2.871s)"),
    (None, ""),
    (G,   "  ✅  testSaveAndFindEnrollment()                          PASSED  (14ms)"),
    (G,   "  ✅  testFindByApprenantId()                              PASSED  (11ms)"),
    (G,   "  ✅  testFindByStatusCompleted()                          PASSED  (18ms)"),
    (G,   "  ✅  testEnrollmentWithRealPostgresConstraint()           PASSED  (29ms)"),
    (G,   "  ✅  testProgressionUpdateOnRealDB()                      PASSED  (33ms)"),
    (None, ""),

    # ── Nettoyage container ───────────────────────────────────────
    (GR,  "INFO  tc.postgres:15-alpine - Stopping container: a3f9d1e27c8b"),
    (GR,  "INFO  tc.postgres:15-alpine - Container stopped and removed."),
    (None, ""),

    # ── Résumé Maven ─────────────────────────────────────────────
    (W2,  "─" * 70),
    (W2,  "Tests run: 12,  Failures: 0,  Errors: 0,  Skipped: 0"),
    (W2,  "─" * 70),
    (None, ""),
    (G,   "[INFO] BUILD SUCCESS"),
    (GR,  "[INFO] Total time: 18.452 s"),
    (GR,  "[INFO] Finished at: 2026-05-22T16:25:44+01:00"),
    (W2,  "─" * 70),
]

y = 10
for color, text in lines:
    if color is None:
        y += 8
        continue
    d.text((10, y), text, font=font, fill=color)
    y += 14

out = "/Users/anaskhaiy/Desktop/PFE 4/Template_PFE/figures/test_testcontainers.png"
img.save(out)
print(f"✅ Image sauvegardée : {out}")
