const LIMITS = {
  listName: {
    min: 1,
    max: 64
  },
  taskDescription: {
    min: 1,
    max: 240
  }
};

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function validateLength(value, label, { min, max }) {
  const normalized = normalizeText(value);

  if (normalized.length < min) {
    return `${label} is required`;
  }

  if (normalized.length > max) {
    return `${label} must be ${max} characters or less`;
  }

  return true;
}

function validateListName(value) {
  return validateLength(value, 'List name', LIMITS.listName);
}

function validateTaskDescription(value) {
  return validateLength(value, 'Task description', LIMITS.taskDescription);
}

module.exports = {
  LIMITS,
  normalizeText,
  validateListName,
  validateTaskDescription
};