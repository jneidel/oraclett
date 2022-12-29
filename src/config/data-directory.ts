import fs from "fs/promises";

export const DATA_DIR = `${process.env.HOME}/.local/share/oraclett`;
export const PROJECTS_FILE = `${DATA_DIR}/projects.json`;
export const HOURS_FILE = `${DATA_DIR}/hours.json`;
export const TASKS_FILE = `${DATA_DIR}/tasks.json`;

export async function createDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}
