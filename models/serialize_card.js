// @ts-check
 
/**
 * Serializes a raw Mongoose creator card document into the API response shape.
 *
 * Handles two mismatches between the DB layer and the spec:
 *  1. `_id` (ULID string) → `id`
 *  2. `deleted: 0` (paranoid sentinel) → `deleted: null`
 *
 * @param {Object} doc - A Mongoose document or plain object (e.g. from .lean())
 * @returns {Object} - API-safe representation
 */
function serializeCard(doc) {
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
 
  const { _id, deleted, ...rest } = raw;
 
  return {
    id: _id,
    ...rest,
    deleted: deleted === 0 ? null : deleted,
  };
}
 
module.exports = { serializeCard };