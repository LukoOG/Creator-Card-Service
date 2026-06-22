// @ts-check
const { CreatorCard } = require('@app/models');
const { serializeCard } = require('@app/serializers');
const { CARD_ERRORS, throwBusinessError } = require('@app/errors');

const { throwAppError, ERROR_CODE } = require('@app-core/errors');

/**
 * Retrieves a single published creator card by slug, enforcing
 * private-card access control via an access_code query param.
 *
 * @param {Object} params
 * @param {string} params.slug
 * @param {string} [params.access_code]
 * @returns {Promise<Object>}
 */
async function getCreatorCardService({ slug, access_code }) {
  // deleted: 0 means active (paranoid mode sentinel — see model)
  const card = await CreatorCard.findOne({ slug, deleted: 0 });

  // 1. No card with that slug
  if (!card) throwBusinessError(CARD_ERRORS.CARD_NOT_FOUND);

  // 2. Card exists but is a draft — distinct code from "doesn't exist"
  if (card.status === 'draft') throwBusinessError(CARD_ERRORS.CARD_IS_DRAFT);

  // 3 & 4. Private card access control
  if (card.access_type === 'private') {
    if (!access_code) throwBusinessError(CARD_ERRORS.ACCESS_CODE_MISSING);

    if (access_code !== card.access_code) throwBusinessError(CARD_ERRORS.ACCESS_CODE_INVALID);
  }

  // 5. Access granted
  return serializeCard(card)
}

module.exports = getCreatorCardService;