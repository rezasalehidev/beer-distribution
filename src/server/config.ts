import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '../../beer_game.db'),
  CLIENT_DIST_PATH: path.resolve(__dirname, '../../dist/client'),
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
