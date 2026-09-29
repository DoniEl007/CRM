import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  JWT_ACCESS_SECRET: Joi.string().min(8).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(8).required(),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_BUCKET_AVATARS: Joi.string().default('avatars'),
  MINIO_BUCKET_TASK_FILES: Joi.string().default('task-attachments'),

  TELEGRAM_BOT_TOKEN: Joi.string().allow('').default(''),
  TELEGRAM_BOT_USERNAME: Joi.string().allow('').default(''),

  // Optional: only used to create the very first Full Administrator account
  // on a fresh install with an empty users table.
  BOOTSTRAP_ADMIN_EMAIL: Joi.string().email({ tlds: false }).allow('').default(''),
  BOOTSTRAP_ADMIN_PASSWORD: Joi.string().allow('').default(''),
});
