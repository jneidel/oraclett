import * as dotenv from "dotenv";
import { expand } from "dotenv-expand";
import path from "path";
import fs from "fs/promises";

export function loadEnvVariables() {
  const projectBase = path.resolve(__dirname, "..", ".." );
  process.env.PROJECT_BASE = projectBase;

  const env = dotenv.config( { path: path.resolve( projectBase, ".env" ) } );
  const local = dotenv.config( { path: path.resolve( projectBase, ".env.local" ), override: true });
  expand(env);
  expand(local);
}

export async function createConfigDir() {
  fs.mkdir(process.env.CONFIG_DIR || ".", { recursive: true });
}
