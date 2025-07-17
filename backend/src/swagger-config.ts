import path from "path";
import YAML from "yamljs";
import { ENV } from "./config/env";


// Docs
const swaggerMain = YAML.load(path.join(__dirname, "docs/swagger.yml"));

const serverUrl = ENV.SERVER_URL ?? "http://localhost:4000";
swaggerMain.servers = [
  {
    url: serverUrl,
  },
];

swaggerMain.paths = {

}

export const swaggerOptions = swaggerMain;