import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const HEX_RE = /^0x[0-9a-fA-F]+$/;

@ValidatorConstraint({ name: 'isHex', async: false })
export class IsHexConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    if (!HEX_RE.test(value)) return false;

    const opts = args.constraints[0] as { evenLength?: boolean } | undefined;
    if (opts?.evenLength && value.length % 2 !== 0) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const opts = args.constraints[0] as { evenLength?: boolean } | undefined;
    if (opts?.evenLength) {
      return '$property must be a hex string (0x-prefixed, even length)';
    }
    return '$property must be a hex string (0x-prefixed, [0-9a-fA-F])';
  }
}

export function IsHex(
  options?: { evenLength?: boolean },
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      constraints: [options],
      validator: IsHexConstraint,
    });
  };
}
