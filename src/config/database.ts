const { Sequelize } = require("sequelize");
import path from "path";

let sequelize;

export async function setupDatabase() {
  const databaseFile = path.resolve( process.env.PROJECT_BASE || ".", process.env.DATABASE_PATH || "db.sqlite" );
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: databaseFile,
  });

  return sequelize;
}

export function getDatabase() {
  return sequelize;
}
