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

        if (!result.ok) {
            return {
                status: result.status,
                message: result.message,
                data: { errorCode: result.errorCode },
            };
        }

        return {
            status: helpers.http_statuses.HTTP_200_OK,
            message: result.message,
            data: result.data,
        };
    },

    async onResponseEnd(rc, rs) {
        appLogger.info({ requestContext: rc, response: rs }, 'delete-creator-card-completed');
    },
})