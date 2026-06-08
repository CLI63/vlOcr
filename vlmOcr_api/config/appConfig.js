require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

function parseList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return fallback;
  }
  return value.trim();
}

const config = {
  isProduction,
  port: process.env.PORT || '3000',
  jwtSecret: requiredEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS),
  allowedImageHosts: parseList(process.env.ALLOWED_IMAGE_HOSTS).map((host) => host.toLowerCase()),
  publicFileBaseUrl: process.env.PUBLIC_FILE_BASE_URL || '',
  maxUploadMb: Number.parseInt(process.env.MAX_UPLOAD_MB || '10', 10),
  db: {
    host: requiredEnv('DB_HOST'),
    user: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
  },
  apiKeys: {
    glm: optionalEnv('GLM_API_KEY'),
    paddle: optionalEnv('PADDLE_API_KEY'),
  },
};

if (!Number.isFinite(config.maxUploadMb) || config.maxUploadMb <= 0) {
  throw new Error('MAX_UPLOAD_MB must be a positive integer');
}

if (!Number.isFinite(config.db.port) || config.db.port <= 0) {
  throw new Error('DB_PORT must be a positive integer');
}

if (isProduction && config.allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS is required in production');
}

module.exports = config;
