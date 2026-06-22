// @ts-check
const { CreatorCard } = require('@app/models');
const { serializeCard } = require('@app/serializers');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');

const ACCESS_ERROR = {
  CARD_NOT_FOUND:        { errorCode: ERROR_CODE.NOTFOUND,  code: 'NF01', message: 'Creator card not found' },
  CARD_IS_DRAFT:         { errorCode: ERROR_CODE.NOTFOUND,  code: 'NF02', message: 'Creator card not found' },
  ACCESS_CODE_REQUIRED:  { errorCode: ERROR_CODE.INVLDREQ, code: 'AC03', message: 'This card is private. An access_code is required' },
  ACCESS_CODE_INVALID:   { errorCode: ERROR_CODE.INVLDREQ, code: 'AC04', message: 'The supplied access_code is invalid' },
};

/**
 * Convenience wrapper — throws with the correct HTTP status and business code.
 * Response shape:
 * { status: "error", message, errors: "NF01"  }
 *
 * @param {{ errorCode: string, code: string, message: string }} errorDef
 */
function throwAccessError({ errorCode, code, message }) {
  throwAppError(message, errorCode, { details:  code , context: undefined });
}


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
  if (!card) throwAccessError(ACCESS_ERROR.CARD_NOT_FOUND);

  // 2. Card exists but is a draft — distinct code from "doesn't exist"
  if (card.status === 'draft') throwAccessError(ACCESS_ERROR.CARD_IS_DRAFT)

  // 3 & 4. Private card access control
  if (card.access_type === 'private') {
    if (!access_code) throwAccessError(ACCESS_ERROR.ACCESS_CODE_REQUIRED)

    if (access_code !== card.access_code) throwAccessError(ACCESS_ERROR.ACCESS_CODE_INVALID)
  }

  // 5. Access granted
  return serializeCard(card)
}

module.exports = getCreatorCardService;