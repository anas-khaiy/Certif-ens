package com.certiflow.formateur.controller;

import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanPublishData;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/livekit")
public class LiveKitController {

    @Value("${livekit.api.key}")
    private String apiKey;

    @Value("${livekit.api.secret}")
    private String apiSecret;

    @Value("${livekit.host:http://localhost:7880}")
    private String livekitHost;

    // ─── Helper ───────────────────────────────────────────────────────────────

    private RoomServiceClient roomClient() {
        return RoomServiceClient.Companion.createClient(livekitHost, apiKey, apiSecret);
    }

    private boolean roomExists(String room) throws Exception {
        List<livekit.LivekitModels.Room> rooms =
                roomClient().listRooms(List.of(room)).execute().body();
        return rooms != null && rooms.stream().anyMatch(r -> r.getName().equals(room));
    }

    // ─── Token endpoint ───────────────────────────────────────────────────────

    /**
     * Issues a LiveKit JWT.
     *
     * - createRoom=true  → called by the formateur; no prior-room check.
     * - createRoom=false → called by apprenants; room MUST already exist.
     */
    @GetMapping("/token")
    public ResponseEntity<?> getToken(
            @RequestParam String room,
            @RequestParam String identity,
            @RequestParam(required = false, defaultValue = "false") boolean canPublish,
            @RequestParam(required = false, defaultValue = "false") boolean createRoom) {

        if (!createRoom) {
            try {
                if (!roomExists(room)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error",
                                    "La session n'a pas encore été lancée par le formateur."));
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error",
                                "Impossible de vérifier la session LiveKit: " + e.getMessage()));
            }
        }

        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(identity);
        token.setIdentity(identity);
        token.addGrants(
                new RoomJoin(true),
                new RoomName(room),
                new CanPublish(canPublish),
                new CanSubscribe(true),
                new CanPublishData(canPublish)
        );

        return ResponseEntity.ok(Map.of("token", token.toJwt()));
    }

    // ─── Active-room check (polled by apprenants) ─────────────────────────────

    /**
     * GET /api/v1/livekit/status?room=…
     * Returns {"active": true/false}.
     * Apprenants poll this while in a call; when false they auto-leave.
     */
    @GetMapping("/status")
    public ResponseEntity<?> roomStatus(@RequestParam String room) {
        try {
            return ResponseEntity.ok(Map.of("active", roomExists(room)));
        } catch (Exception e) {
            // Treat any error as "room gone" so the apprenant leaves gracefully
            return ResponseEntity.ok(Map.of("active", false));
        }
    }

    // ─── End room (called when formateur disconnects) ─────────────────────────

    /**
     * POST /api/v1/livekit/end?room=…
     * Deletes the room from LiveKit, which disconnects every participant.
     */
    @PostMapping("/end")
    public ResponseEntity<?> endRoom(@RequestParam String room) {
        try {
            roomClient().deleteRoom(room).execute();
        } catch (Exception e) {
            // Log but don't block — the formateur's UI already exited
            System.err.println("LiveKit deleteRoom failed for " + room + ": " + e.getMessage());
        }
        return ResponseEntity.ok().build();
    }
}
