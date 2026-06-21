// @ts-check
const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { ulid } = require('ulid');
const { CreatorCard } = require('@app/models');
const { serializeCard } = require('@app/serializers/serialize_card');

// ─── Validation Spec ──────────────────────────────────────────────────────────
// Handles: presence, types, and length ranges.
// Enums, regex patterns, exact lengths, and cross-field rules are checked
// manually below — the DSL has no syntax for those.

// Only fields that are UNCONDITIONALLY required on every request go here.
// Every field declared in this DSL is implicitly required — there is no
// "optional" keyword — so optional/conditional fields (description, links,
// service_rates, status, access_type, access_code) are deliberately left
// OUT of the spec and validated manually below instead.
const createCardSpec = validator.parse(`root {
  title {
    is a required string
    is displayed in error messages as: Title
    is between 3 and 100
  }
  slug {
    is a required string
    is displayed in error messages as: Slug
    is between 5 and 50
  }
  creator_reference {
    is a required string
    is displayed in error messages as: Creator Reference
    is between 20 and 20
  }
}`);

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['draft', 'published'];
const VALID_ACCESS_TYPES = ['public', 'private'];
const VALID_CURRENCIES = ['NGN', 'USD', 'GBP', 'GHS'];
const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const ACCESS_CODE_REGEX = /^[a-zA-Z0-9]{6}$/;
const URL_REGEX = /^https?:\/\//i;

// ─── Manual Validators ────────────────────────────────────────────────────────

function validateLinks(links) {
  if (!links || links.length === 0) return;

  links.forEach((link, i) => {
    const position = `links[${i}]`;

    if (!link.title || typeof link.title !== 'string') {
      throwAppError(`${position}.title is required and must be a string`, ERROR_CODE.INVLDDATA);
    }
    if (link.title.length < 1 || link.title.length > 100) {
      throwAppError(`${position}.title must be between 1 and 100 characters`, ERROR_CODE.INVLDDATA);
    }
    if (!link.url || typeof link.url !== 'string') {
      throwAppError(`${position}.url is required and must be a string`, ERROR_CODE.INVLDDATA);
    }
    if (link.url.length > 200) {
      throwAppError(`${position}.url must not exceed 200 characters`, ERROR_CODE.INVLDDATA);
    }
    if (!URL_REGEX.test(link.url)) {
      throwAppError(`${position}.url must start with http:// or https://`, ERROR_CODE.INVLDDATA);
    }
  });
}

function validateServiceRates(serviceRates) {
  if (!serviceRates) return;

  if (!VALID_CURRENCIES.includes(serviceRates.currency)) {
    throwAppError(
      `service_rates.currency must be one of: ${VALID_CURRENCIES.join(', ')}`,
      ERROR_CODE.INVLDDATA
    );
  }

  if (!Array.isArray(serviceRates.rates) || serviceRates.rates.length === 0) {
    throwAppError('service_rates.rates must be a non-empty array', ERROR_CODE.INVLDDATA);
  }

  serviceRates.rates.forEach((rate, i) => {
    const position = `service_rates.rates[${i}]`;

    if (!rate.name || typeof rate.name !== 'string') {
      throwAppError(`${position}.name is required and must be a string`, ERROR_CODE.INVLDDATA);
    }
    if (rate.name.length < 3 || rate.name.length > 100) {
      throwAppError(`${position}.name must be between 3 and 100 characters`, ERROR_CODE.INVLDDATA);
    }
    if (rate.description && rate.description.length > 250) {
      throwAppError(`${position}.description must not exceed 250 characters`, ERROR_CODE.INVLDDATA);
    }
    if (rate.amount === undefined || rate.amount === null) {
      throwAppError(`${position}.amount is required`, ERROR_CODE.INVLDDATA);
    }
    if (!Number.isInteger(rate.amount) || rate.amount < 1) {
      throwAppError(`${position}.amount must be a positive integer`, ERROR_CODE.INVLDDATA);
    }
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Creates a new creator card.
 * @param {Object} payload - Raw request body
 * @returns {Promise<Object>} Serialized creator card
 */
async function createCreatorCardService(payload) {
  // 1. Structural validation for the unconditionally-required fields only.
  // (title, slug, creator_reference — type + length checked by the DSL)
  const { title, slug, creator_reference } = validator.validate(payload, createCardSpec);

  // Everything else is optional/conditional, so it's pulled straight from
  // the raw payload and validated manually below.
  const {
    description = '',
    links = [],
    service_rates = null,
    status = 'draft',
    access_type = 'public',
    access_code = null,
  } = payload;

  // 2. Manual validation — enums, regex, exact lengths, cross-field rules

  if (description && typeof description !== 'string') {
    throwAppError('description must be a string', ERROR_CODE.INVLDDATA);
  }
  if (description && description.length > 500) {
    throwAppError('description must not exceed 500 characters', ERROR_CODE.INVLDDATA);
  }

  if (!SLUG_REGEX.test(slug)) {
    throwAppError(
      'slug may only contain letters, numbers, hyphens and underscores',
      ERROR_CODE.INVLDDATA
    );
  }

  if (status && !VALID_STATUSES.includes(status)) {
    throwAppError(`status must be one of: ${VALID_STATUSES.join(', ')}`, ERROR_CODE.INVLDDATA);
  }

  if (access_type && !VALID_ACCESS_TYPES.includes(access_type)) {
    throwAppError(
      `access_type must be one of: ${VALID_ACCESS_TYPES.join(', ')}`,
      ERROR_CODE.INVLDDATA
    );
  }

  // access_code is required when access_type is private
  if (access_type === 'private') {
    if (!access_code) {
      throwAppError('access_code is required when access_type is private', ERROR_CODE.INVLDDATA);
    }
    if (!ACCESS_CODE_REGEX.test(access_code)) {
      throwAppError('access_code must be exactly 6 alphanumeric characters', ERROR_CODE.INVLDDATA);
    }
  }

  // access_code must not be set on public cards
  if (access_type === 'public' && access_code) {
    throwAppError('access_code should not be provided when access_type is public', ERROR_CODE.INVLDDATA);
  }

  // Normalize: public cards always store null, never an empty string
  const normalizedAccessCode = access_type === 'private' ? access_code : null;

  validateLinks(links);
  validateServiceRates(service_rates);

  // 3. DB write
  const now = Date.now();

  try {
    const card = await CreatorCard.create({
      _id: ulid(),
      title,
      description,
      slug,
      creator_reference,
      links,
      service_rates,
      status,
      access_type,
      access_code: normalizedAccessCode,
      created: now,
      updated: now,
    });

    // 4. Serialize: _id → id, deleted: 0 → null
    return serializeCard(card);
  } catch (error) {
    // Mongoose duplicate key error (slug collision)
    if (error.code === 11000) {
      throwAppError('A creator card with this slug already exists', ERROR_CODE.DUPLRCRD);
    }
    throw error;
  }
}

module.exports = createCreatorCardService;