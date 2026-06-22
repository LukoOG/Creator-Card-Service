// @ts-check
const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const { deleteCreatorCardService } = require('@app/services')

/**
 * DELETE /creator-cards/:slug
 * Deletes a published creator card by slug.
 * Confirmation via provided creator reference
 */

module.exports = createHandler({
    method: 'delete',
    path: '/creator-cards/:slug',
    middlewares: [],

    async handler(rc, helpers) {
        const { slug } = rc.params;
        const payload = rc.body;

        const result = await deleteCreatorCardService({ slug, payload });

        return {
            status: helpers.http_statuses.HTTP_200_OK,
            message: "Creator Card Deleted Successfully.",
            data: result,
        };
    },

    async onResponseEnd(rc, rs) {
        appLogger.info({ requestContext: rc, response: rs }, 'delete-creator-card-completed');
    },
})