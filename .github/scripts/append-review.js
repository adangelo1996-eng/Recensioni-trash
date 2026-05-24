const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REVIEWS_PATH = path.join(__dirname, '../../data/reviews.json');

function stripHtmlTags(str) {
  return str.replace(/<[^>]*>/g, '');
}

function parsePayload(payloadStr) {
  if (!payloadStr) {
    throw new Error('PAYLOAD environment variable is required');
  }

  try {
    const data = JSON.parse(payloadStr);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('PAYLOAD must be a JSON object');
    }
    return data;
  } catch (err) {
    if (err.message.startsWith('PAYLOAD')) {
      throw err;
    }
    throw new Error('PAYLOAD must be valid JSON');
  }
}

function validate(data) {
  if (typeof data.trashName !== 'string') {
    throw new Error('trashName is required and must be a string');
  }

  const trashName = stripHtmlTags(data.trashName).trim();
  if (trashName.length === 0) {
    throw new Error('trashName cannot be empty');
  }
  if (trashName.length > 40) {
    throw new Error('trashName must be at most 40 characters');
  }

  const scoreFields = ['food', 'guide', 'hospitality'];
  const scores = {};

  for (const field of scoreFields) {
    const value = data[field];
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      throw new Error(`${field} must be an integer between 0 and 5`);
    }
    scores[field] = value;
  }

  const total = scores.food + scores.guide + scores.hospitality;
  if (total !== 10) {
    throw new Error('food + guide + hospitality must equal 10');
  }

  let comment;
  if (data.comment !== undefined && data.comment !== null && data.comment !== '') {
    if (typeof data.comment !== 'string') {
      throw new Error('comment must be a string');
    }
    comment = data.comment.trim();
    if (comment.length > 500) {
      throw new Error('comment must be at most 500 characters');
    }
  }

  const review = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    trashName,
    food: scores.food,
    guide: scores.guide,
    hospitality: scores.hospitality,
  };

  if (comment) {
    review.comment = comment;
  }

  return review;
}

function loadReviews() {
  if (!fs.existsSync(REVIEWS_PATH)) {
    return [];
  }

  const content = fs.readFileSync(REVIEWS_PATH, 'utf8');
  const reviews = JSON.parse(content);

  if (!Array.isArray(reviews)) {
    throw new Error('data/reviews.json must contain a JSON array');
  }

  return reviews;
}

function main() {
  try {
    const data = parsePayload(process.env.PAYLOAD);
    const review = validate(data);
    const reviews = loadReviews();

    reviews.push(review);
    fs.writeFileSync(REVIEWS_PATH, `${JSON.stringify(reviews, null, 2)}\n`);

    console.log(`Review appended: ${review.id}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
