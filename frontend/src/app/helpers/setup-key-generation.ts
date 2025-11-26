import { FormGroup } from '@angular/forms';
import { toCamelCase } from './toCamelCase';

export const setupKeyGeneration = (
  form: FormGroup<any>,
  ctrl: string,
  targetCtrl: string
) => {
  form.get(`${ctrl}`)?.valueChanges.subscribe((ctrlValue: string) => {
    if (ctrlValue) {
      const generated = toCamelCase(ctrlValue);
      form.get(`${targetCtrl}`)?.setValue(generated, { emitEvent: false });
    }
  });
};
