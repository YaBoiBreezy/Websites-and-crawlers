import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { InputValidationError } from "./errors.js";

export function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req);

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        let message = fromZodError(error);

        console.error(message);

        return next(new InputValidationError(message));
      }

      return next(error);
    }
  };
}
