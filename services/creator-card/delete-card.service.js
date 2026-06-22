// @ts-check
const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCard } = require('@app/models');
const { serializeCard } = require('@app/serializers/serialize_card');

// ─── Validation Spec ──────────────────────────────────────────────────────────

const deleteCardSpec = validator.parse(`root {
  creator_reference {
    is a required string
    is displayed in error messages as: Creator Reference
    is between 20 and 20
  }
}`);

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Soft-deletes a creator card by slug.
 * Verifies the card exists and the creator_reference matches before deleting.
 *
 * @param {Object} params
 * @param {string} params.slug
 * @param {Object} params.payload - Request body
 * @returns {Promise<{ok: boolean, status: number, errorCode?: string, message: string, data?: Object}>}
 */
async function deleteCreatorCardService({ slug, payload }) {
  // 1. Validate body — creator_reference presence and exact length
  const { creator_reference } = validator.validate(payload, deleteCardSpec);

  // 2. Find the active card by slug
  const card = await CreatorCard.findOne({ slug, deleted: 0 });

  if (!card) {
    return { ok: false, status: 404, errorCode: 'NF01', message: 'Creator card not found' };
  }

  // 3. Ownership check — the requester must be the card's creator.
  // This prevents one creator from deleting another creator's card
  // even if they somehow know the slug.
  if (card.creator_reference !== creator_reference) {
    throwAppError(
      'You do not have permission to delete this card',
      ERROR_CODE.PERMERR
    );
  }

  // 4. Soft-delete: stamp deleted with current epoch ms (paranoid pattern)
  const deletedAt = Date.now();
  card.deleted = deletedAt;
  card.updated = deletedAt;
  await card.save();

  // 5. Return the deleted card in full — same shape as the create response
  return {
    ok: true,
    status: 200,
    message: 'Creator Card Deleted Successfully.',
    data: serializeCard(card),
  };
}

module.exports = deleteCreatorCardService;