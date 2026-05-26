package com.lseg.msgfeed.plugin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.refinitiv.collab.platform.msgfeed.handler.ChatroomMessageHandler;

/**
 * WebSocketPlugin
 * ───────────────
 * Implements the LSEG ChatroomMessageHandler interface.
 *
 * Strategy: write every received message as a single-line JSON string to
 * System.out.  The Node.js ProcessManager reads stdout line-by-line and
 * forwards each object to connected browser clients via WebSocket.
 *
 * The special sentinel line "__CONNECTED__" is printed once on startup so
 * the Node backend knows the feed is live.
 *
 * Build this as a "fat jar" (all dependencies bundled) and drop the jar
 * into the /plugins directory before starting message-feed-0.0.42.0.jar.
 */
public class WebSocketPlugin implements ChatroomMessageHandler {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    static {
        // Signal to the Node.js parent process that we are live
        System.out.println("__CONNECTED__");
        System.out.flush();
    }

    /**
     * Called by the LSEG Message Feed app for every message received.
     *
     * @param messageJson  Raw JSON string of the ChatMessageEvent
     */
    @Override
    public void handleChatroomMessage(String messageJson) {
        try {
            // Parse then re-serialise to guarantee single-line output
            // (the raw string may contain embedded newlines in some edge cases)
            Object parsed = MAPPER.readValue(messageJson, Object.class);
            String oneLine = MAPPER.writeValueAsString(parsed);
            System.out.println(oneLine);
            System.out.flush();
        } catch (Exception e) {
            // Log to stderr so Node can capture as an error log entry
            System.err.println("[WebSocketPlugin] Failed to process message: " + e.getMessage());
            System.err.println("[WebSocketPlugin] Raw: " + messageJson);
        }
    }
}
