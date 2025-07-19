import path from "path";
import YAML from "yamljs";
import { ENV } from "./config/env";
import deepmerge from "deepmerge";

// Docs
const swaggerMain = YAML.load(path.join(__dirname, "docs/swagger.yml"));
const authDoc = YAML.load(path.join(__dirname, "docs/auth.yml"));
const userDoc = YAML.load(path.join(__dirname, "docs/user.yml"));

const serverUrl = ENV.SERVER_URL ?? "http://localhost:4000";
swaggerMain.servers = [
  {
    url: serverUrl,
  },
];

const mergedSwagger = deepmerge.all([swaggerMain, authDoc, userDoc]);

export const swaggerOptions = mergedSwagger;
