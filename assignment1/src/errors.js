export class InputValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputValidationError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export class BusinessRuleViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BusinessRuleViolationError";
  }
}

export class UnknownError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnknownError";
  }
}
