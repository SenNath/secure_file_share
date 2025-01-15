import { useState, useCallback } from 'react';

interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

interface ValidationRules {
  [field: string]: ValidationRule[];
}

interface ValidationErrors {
  [field: string]: string[];
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback(
    (field: string, value: any) => {
      const fieldRules = rules[field] || [];
      const fieldErrors: string[] = [];

      fieldRules.forEach((rule) => {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message);
        }
      });

      setErrors((prev) => ({
        ...prev,
        [field]: fieldErrors,
      }));

      return fieldErrors.length === 0;
    },
    [rules]
  );

  const validateForm = useCallback(
    (values: { [field: string]: any }) => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      Object.keys(rules).forEach((field) => {
        const fieldRules = rules[field];
        const fieldErrors: string[] = [];

        fieldRules.forEach((rule) => {
          if (!rule.validate(values[field])) {
            fieldErrors.push(rule.message);
            isValid = false;
          }
        });

        if (fieldErrors.length > 0) {
          newErrors[field] = fieldErrors;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [rules]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    validate: (value: string) =>
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
    message,
  }),

  minLength: (length: number, message = `Must be at least ${length} characters`): ValidationRule => ({
    validate: (value: string) => value.length >= length,
    message,
  }),

  maxLength: (length: number, message = `Must be no more than ${length} characters`): ValidationRule => ({
    validate: (value: string) => value.length <= length,
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  match: (matchValue: any, message: string): ValidationRule => ({
    validate: (value: any) => value === matchValue,
    message,
  }),

  custom: (validateFn: (value: any) => boolean, message: string): ValidationRule => ({
    validate: validateFn,
    message,
  }),
}; 