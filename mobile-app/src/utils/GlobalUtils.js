import * as EmailValidator from "email-validator";

const isValidEmail = (email) => {
  return EmailValidator.validate(email);
};

export { isValidEmail };
