// Password validation rules and utilities
export const PASSWORD_RULES = {
  hasNumber: /\d/,
  hasLowerCase: /[a-z]/,
  hasUpperCase: /[A-Z]/,
  hasSpecialChar: /[!-/:-@[-`{-~]/, // Matches all common special characters on an English keyboard
  minLength: 8,
};

/**
 * Validates a password against all required rules
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets all requirements
 */
export const validatePassword = (password) => {
  const hasNumber = PASSWORD_RULES.hasNumber.test(password);
  const hasLowerCase = PASSWORD_RULES.hasLowerCase.test(password);
  const hasUpperCase = PASSWORD_RULES.hasUpperCase.test(password);
  const hasSpecialChar = PASSWORD_RULES.hasSpecialChar.test(password);
  const isMinLength = password.length >= PASSWORD_RULES.minLength;

  return hasNumber && hasLowerCase && hasUpperCase && hasSpecialChar && isMinLength;
};

/**
 * Returns individual rule validation results for a password
 * @param {string} password - The password to check
 * @returns {Object} - Object with boolean values for each rule
 */
export const getPasswordRuleResults = (password) => {
  return {
    hasNumber: PASSWORD_RULES.hasNumber.test(password),
    hasLowerCase: PASSWORD_RULES.hasLowerCase.test(password),
    hasUpperCase: PASSWORD_RULES.hasUpperCase.test(password),
    hasSpecialChar: PASSWORD_RULES.hasSpecialChar.test(password),
    isMinLength: password.length >= PASSWORD_RULES.minLength,
  };
};
