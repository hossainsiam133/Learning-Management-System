import type { Core } from '@strapi/strapi';

const requireEnv = (env: Core.Config.Shared.ConfigParams['env'], key: string): string => {
  const value = env(key, '');

  if (!value || value === 'tobemodified' || value === 'toBeModified1') {
    throw new Error(`${key} is missing or still using the default placeholder value in strapi/.env.`);
  }

  return value;
};

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: requireEnv(env, 'ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: requireEnv(env, 'API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: requireEnv(env, 'TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: requireEnv(env, 'ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default config;
