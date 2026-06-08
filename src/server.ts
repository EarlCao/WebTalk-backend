import { createServer } from "node:http";

import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import { createSocketServer } from "./config/socket";
import { registerSocketHandlers } from "./socket/index";

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

registerSocketHandlers(io);

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  console.log(`${signal} received. Shutting down server...`);

  httpServer.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});

process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});

const main = async (): Promise<void> => {
  try {
    await connectDatabase();

    httpServer.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void main();
