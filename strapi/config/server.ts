import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => {
  const appKeys = env.array('APP_KEYS');

  if (!appKeys || appKeys.length < 2) {
    throw new Error(
      'APP_KEYS is missing or invalid. Add at least 2 comma-separated values to strapi/.env.'
    );
  }

  return {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
      keys: appKeys,
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};

export default config;
