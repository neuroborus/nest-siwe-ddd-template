import {
  registerDecorator,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const EVM_SIGNATURE_RE = /^0x[0-9a-fA-F]{130}$/;

@ValidatorConstraint({ name: 'isEvmSignature', async: false })
export class IsEvmSignatureConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && EVM_SIGNATURE_RE.test(value);
  }

  defaultMessage(): string {
    return '$property must be a valid EVM signature (0x + 130 hex chars, 65 bytes)';
  }
}

export function IsEvmSignature(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      constraints: [],
      validator: IsEvmSignatureConstraint,
    });
  };
}
