import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(
  passwordField: string,
  confirmPasswordField: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField);
    const confirmPassword = control.get(confirmPasswordField);

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  };
}

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const errors: any = {};

    if (!/[A-Z]/.test(value)) {
      errors.missingUppercase = true;
    }

    if (!/\d/.test(value)) {
      errors.missingNumber = true;
    }

    if (!/[\W_]/.test(value)) {
      errors.missingSpecialChar = true;
    }

    if (value.length < 8) {
      errors.minLength = true;
    }

    return Object.keys(errors).length > 0
      ? { passwordComplexity: errors }
      : null;
  };
}
