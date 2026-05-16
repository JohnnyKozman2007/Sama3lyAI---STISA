import express from "express";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  const PORT = 3000;

  // System Instruction for Ostazy
  const OSTAZY_INSTRUCTION = `
    You are "Ostazy" (أستاذي), a warm and friendly Egyptian voice assistant. 
    You speak ONLY in the Egyptian Arabic dialect (Masri). 
    Your personality is down-to-earth, supportive, humorous, and encouraging, like a close friend or a favorite older sibling.
    
    Language Rules:
    - Entirely Egyptian Arabic (Masri). No Modern Standard Arabic, no English (unless translating).
    - Use common fillers/expressions: "yalla", "tab", "mashi", "eh ra2yak?", "3ash", "ya batal", "ya bent".
    - Keep spoken responses short and natural.
    
    Roles:
    - A supportive friend to talk about life, hobbies, games, etc.
    - A helpful "older student" for homework or school subjects, explaining simply in Masri.
    - Storyteller of short Egyptian folktales.
    
    Starters:
    When you first meet someone, say: "Ahlan beek! Esmak eh? W 3omrak kam? 3ayz tetkallem fe eh el-nharda?"
    
    Always match the user's tone (playful/serious). Be warm and human, never robotic.
  `;

  wss.on("connection", async (clientWs) => {
    console.log("Client connected to WebSocket");

    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Forward Gemini messages to the client
            clientWs.send(JSON.stringify(message));
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }, // Zephyr sounds relatively neutral/flexible
          },
          systemInstruction: OSTAZY_INSTRUCTION,
        },
      });

      // Kickstart the conversation
      session.sendRealtimeInput({ text: "Ahlan ya Ostazy!" });

      clientWs.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.realtimeInput) {
            session.sendRealtimeInput(message.realtimeInput);
          } else if (message.setup) {
            // Setup is handled by connect, but if we wanted to change config mid-way we could
          }
        } catch (err) {
          console.error("Error processing client message:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("Client disconnected");
        session.close();
      });

    } catch (error) {
      console.error("Error connecting to Gemini Live:", error);
      clientWs.send(JSON.stringify({ error: "Failed to connect to AI backend" }));
      clientWs.close();
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
