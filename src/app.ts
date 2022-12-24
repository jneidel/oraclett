import * as config from "./config";

config.loadEnvVariables();
config.createConfigDir();
config.setupDatabase();
