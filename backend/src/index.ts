import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = createApp();

app.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      host: env.HOST,
      port: env.PORT,
      corsOrigins: env.corsOrigins,
      upstream: env.UPSTREAM_URL,
    },
    "Backend server started",
  );
});
