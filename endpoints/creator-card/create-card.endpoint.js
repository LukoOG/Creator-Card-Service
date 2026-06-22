// @ts-check
const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const { createCreatorCardService } = require('@app/services');

/**
 * POST /creator-cards
 * Creates a new creator card.
 */
module.exports = createHandler({
  method: 'post',
  path: '/creator-cards',
  middlewares: [],

  async handler(rc, helpers) {
    const payload = rc.body;

    const result = await createCreatorCardService(payload);

    if (!result.ok) {
      return {
        status: result.status,
        message: result.message,
        error: result.errorCode,
      };
    }

    return {
      status: helpers.http_statuses.HTTP_201_CREATED,
      message: 'Creator card created successfully',
      data: result.data,
    };
  },

  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'create-creator-card-completed');
  },
});