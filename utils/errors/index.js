// @ts-check
const { throwAppError, ERROR_CODE } = require('@app-core/errors');

/**
 * Business error definitions for the creator card domain.
 *
 * errorCode → mapped to HTTP status via ERROR_STATUS_CODE_MAPPING in @app-core/errors
 * code      → surfaces in the response body as errors.code
 * message   → surfaces in the response body as message
 */
const CARD_ERRORS = {
  // ── Retrieval ──────────────────────────────────────────────────────────────
  CARD_NOT_FOUND:       { errorCode: ERROR_CODE.NOTFOUND,  code: 'NF01', message: 'Creator card not found' },
  CARD_IS_DRAFT:        { errorCode: ERROR_CODE.NOTFOUND,  code: 'NF02', message: 'Creator card not found' },

  // ── Access control ─────────────────────────────────────────────────────────
  ACCESS_CODE_REQUIRED: { errorCode: ERROR_CODE.INVLDREQ, code: 'AC01', message: 'access_code is required when access_type is private' },
  ACCESS_CODE_ON_PUBLIC:{ errorCode: ERROR_CODE.INVLDREQ, code: 'AC05', message: 'access_code can only be set on private cards' },
  ACCESS_CODE_MISSING:  { errorCode: ERROR_CODE.INVLDREQ, code: 'AC03', message: 'This card is private. An access_code is required' },
  ACCESS_CODE_INVALID:  { errorCode: ERROR_CODE.INVLDREQ, code: 'AC04', message: 'Invalid access code' },

  // ── Slug ───────────────────────────────────────────────────────────────────
  //Petition to throw Duplicate Record error instead of simple 400
  SLUG_TAKEN:           { errorCode: ERROR_CODE.INVLDDATA,  code: 'SL02', message: 'Slug is already taken' },
};

/**
 * This is a helper function that throws a structured business error.
 * Produces: { status: "error", message, errors: code }
 *
 * @param {{ errorCode: string, code: string, message: string }} errorDef
 */
function throwBusinessError({ errorCode, code, message }) {
  throwAppError(message, errorCode, { details:  code, context: undefined  });
}

module.exports = { CARD_ERRORS, throwBusinessError };