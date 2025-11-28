import { ENV } from "@/config/env";

export const getAllowedOrigins = () => {
  const origins = [];

  if (ENV.NODE_ENV === "development") {
    origins.push("http://localhost:8000");
  }

  if (ENV.FRONTEND_URL) {
    origins.push(ENV.FRONTEND_URL);
  }

  if (ENV.ADMIN_URL) {
    origins.push(ENV.ADMIN_URL);
  }

  origins.push("https://specially-survive-prepare-affect.trycloudflare.com");
  return origins;
};
