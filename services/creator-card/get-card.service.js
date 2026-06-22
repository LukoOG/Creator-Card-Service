// @ts-check
const { CreatorCard } = require('@app/models');
const { serializeCard } = require('@app/serializers');

const ACCESS_ERROR = {
  CARD_NOT_FOUND: { status: 404, errorCode: 'NF01', message: 'Creator card not found' },
  CARD_IS_DRAFT: { status: 404, errorCode: 'NF02', message: 'Creator card not found' },
  ACCESS_CODE_REQUIRED: {
    status: 403,
    errorCode: 'AC03',
    message: 'This card is private. An access_code is required',
  },
  ACCESS_CODE_INVALID: {
    status: 403,
    errorCode: 'AC04',
    message: 'The supplied access_code is invalid',
  },
};

/**
 * Retrieves a single published creator card by slug, enforcing
 * private-card access control via an access_code query param.
 *
 * @param {Object} params
 * @param {string} params.slug
 * @param {string} [params.access_code]
 * @returns {Promise<{ok: boolean, status: string, errorCode?: string, message: string, data?: Object}>}
 */
async function getCreatorCardService({ slug, access_code }) {
  // deleted: 0 means active (paranoid mode sentinel — see model)
  const card = await CreatorCard.findOne({ slug, deleted: 0 });

  // 1. No card with that slug
  if (!card) {
    return { ok: false, ...ACCESS_ERROR.CARD_NOT_FOUND };
  }

  // 2. Card exists but is a draft — distinct code from "doesn't exist"
  if (card.status === 'draft') {
    return { ok: false, ...ACCESS_ERROR.CARD_IS_DRAFT };
  }

  // 3 & 4. Private card access control
  if (card.access_type === 'private') {
    if (!access_code) {
      return { ok: false, ...ACCESS_ERROR.ACCESS_CODE_REQUIRED };
    }

    if (access_code !== card.access_code) {
      return { ok: false, ...ACCESS_ERROR.ACCESS_CODE_INVALID };
    }
  }

  // 5. Access granted
  return {
    ok: true,
    status: "success",
    message: 'Creator Card Retrieved Successfully.',
    data: serializeCard(card),
  };
}

module.exports = getCreatorCardService;