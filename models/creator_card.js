// @ts-check
const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator_cards';

/**
 * @typedef {Object} CreatorCardModel
 * @property {string}      id                 - ULID (stored as _id, serialized as id manually)
 * @property {string}      title              - 3–100 chars
 * @property {string}      description        - max 500 chars
 * @property {string}      slug               - 5–50 chars, unique
 * @property {string}      creator_reference  - exactly 20 chars
 * @property {Array}       links              - [{ title, url }]
 * @property {Object|null} service_rates      - { currency, rates[] } | null
 * @property {string}      status             - 'draft' | 'published'
 * @property {string}      access_type        - 'public' | 'private'
 * @property {string|null} access_code        - 6 alphanumeric chars; required when private
 * @property {number}      created            - Unix epoch ms
 * @property {number}      updated            - Unix epoch ms
 * @property {number}      deleted            - 0 = active; epoch ms = deleted (paranoid mode)
 */

const schemaConfig = {
    _id: { type: SchemaTypes.ULID, required: true },
    title: { type: SchemaTypes.String, required: true },
    description: { type: SchemaTypes.String, default: '' },
    slug: { type: SchemaTypes.String, required: true, unique: true, index: true },
    creator_reference: { type: SchemaTypes.String, required: true },
    links: { type: SchemaTypes.Array, default: [] },
    service_rates: { type: SchemaTypes.Mixed, default: null },
    status: { type: SchemaTypes.String, required: true, default: 'draft' },
    access_type: { type: SchemaTypes.String, required: true, default: 'public' },
    access_code: { type: SchemaTypes.String, default: null },
    created: { type: SchemaTypes.Number, required: true },
    updated: { type: SchemaTypes.Number, required: true },
    deleted: { type: SchemaTypes.Number, default: 0 },
}

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

modelSchema.index({ creator_reference: 1, status: 1 });

module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });