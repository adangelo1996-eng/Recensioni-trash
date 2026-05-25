const fs = require('fs');
const path = require('path');

const REVIEWS_PATH = path.join(__dirname, '../../data/reviews.json');

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

function parseDelta(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  return num;
}

function validate(data) {
  if (typeof data.reviewId !== 'string' || !data.reviewId.trim()) {
    throw new Error('reviewId is required and must be a string');
  }

  const reviewId = data.reviewId.trim();
  if (reviewId.indexOf('local-') === 0) {
    throw new Error('reviewId must be a persisted review id');
  }

  const upDelta = parseDelta(data.upDelta, 'upDelta');
  const downDelta = parseDelta(data.downDelta, 'downDelta');

  if (upDelta === 0 && downDelta === 0) {
    throw new Error('upDelta and downDelta cannot both be 0');
  }

  return { reviewId, upDelta, downDelta };
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
    const payload = validate(data);
    const reviews = loadReviews();
    const index = reviews.findIndex(function (review) {
      return String(review.id) === payload.reviewId;
    });

    if (index === -1) {
      throw new Error(`Review not found: ${payload.reviewId}`);
    }

    const review = reviews[index];
    const currentUp = Math.max(0, Number(review.upvotes) || 0);
    const currentDown = Math.max(0, Number(review.downvotes) || 0);
    const nextUp = Math.max(0, currentUp + payload.upDelta);
    const nextDown = Math.max(0, currentDown + payload.downDelta);

    review.upvotes = nextUp;
    review.downvotes = nextDown;

    fs.writeFileSync(REVIEWS_PATH, `${JSON.stringify(reviews, null, 2)}\n`);

    console.log(
      `Votes updated for ${payload.reviewId}: up=${nextUp} down=${nextDown}`
    );
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
