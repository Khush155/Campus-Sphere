const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().url({ message: 'MONGODB_URI must be a valid MongoDB URL' }),
  JWT_SECRET: z.string().min(8, { message: 'JWT_SECRET must be at least 8 characters long' }),
  JWT_REFRESH_SECRET: z.string().min(8, { message: 'JWT_REFRESH_SECRET must be at least 8 characters long' }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  /* eslint-disable no-console */
  console.error('❌ Environment configuration validation failed:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  });
  /* eslint-enable no-console */
  process.exit(1);
}

module.exports = parsedEnv.data;
