// @ts-check
const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const { getCreatorCardService } = require('@app/services');

/**
 * GET /creator-cards/:slug
 * Retrieves a published creator card by slug.
 * Query param `access_code` is required for private cards.
 */
module.exports = createHandler({
    method: 'get',
    path: '/creator-cards/:slug',
    middlewares: [],

    async handler(rc, helpers) {
        const { slug } = rc.params;
        const { access_code } = rc.query;

        const result = await getCreatorCardService({ slug, access_code });

        return {
            status: helpers.http_statuses.HTTP_200_OK,
            message: "Creator Card Retrieved Successfully.",
            data: result,
        };
    },

    async onResponseEnd(rc, rs) {
        appLogger.info({ requestContext: rc, response: rs }, 'get-creator-card-completed');
    },
});