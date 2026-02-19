import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginRequestDto } from '../../application/dtos/requests/login.request';

function toDto(plain: Record<string, unknown>): LoginRequestDto {
  return plainToInstance(LoginRequestDto, plain);
}

async function expectValid(plain: Record<string, unknown>): Promise<void> {
  const errors = await validate(toDto(plain));
  expect(errors).toHaveLength(0);
}

async function expectInvalid(plain: Record<string, unknown>, property: string): Promise<string[]> {
  const errors = await validate(toDto(plain));
  const match = errors.find((e) => e.property === property);
  expect(match).toBeDefined();
  return Object.values(match!.constraints ?? {});
}

const VALID_MESSAGE = 'localhost:3000 wants you to sign in with your Ethereum account:\n0x...';
const VALID_SIGNATURE = `0x${'ab'.repeat(65)}`;

describe('LoginRequestDto validation', () => {
  describe('valid payloads', () => {
    it('should accept a valid message + 65-byte hex signature', async () => {
      await expectValid({ message: VALID_MESSAGE, signature: VALID_SIGNATURE });
    });

    it('should accept uppercase hex chars in signature', async () => {
      await expectValid({
        message: VALID_MESSAGE,
        signature: `0x${'AB'.repeat(65)}`,
      });
    });

    it('should accept mixed-case hex chars in signature', async () => {
      await expectValid({
        message: VALID_MESSAGE,
        signature: `0x${'aB'.repeat(65)}`,
      });
    });
  });

  describe('signature — IsEvmSignature', () => {
    it('should reject missing signature', async () => {
      const msgs = await expectInvalid({ message: VALID_MESSAGE }, 'signature');
      expect(msgs.some((m) => m.includes('signature'))).toBe(true);
    });

    it('should reject empty string', async () => {
      await expectInvalid({ message: VALID_MESSAGE, signature: '' }, 'signature');
    });

    it('should reject hex without 0x prefix', async () => {
      await expectInvalid({ message: VALID_MESSAGE, signature: 'ab'.repeat(65) }, 'signature');
    });

    it('should reject non-hex characters', async () => {
      await expectInvalid(
        { message: VALID_MESSAGE, signature: `0x${'zz'.repeat(65)}` },
        'signature',
      );
    });

    it('should reject signature with wrong length (too short, 64 bytes)', async () => {
      await expectInvalid(
        { message: VALID_MESSAGE, signature: `0x${'ab'.repeat(64)}` },
        'signature',
      );
    });

    it('should reject signature with wrong length (too long, 66 bytes)', async () => {
      await expectInvalid(
        { message: VALID_MESSAGE, signature: `0x${'ab'.repeat(66)}` },
        'signature',
      );
    });

    it('should reject signature that is just "0x"', async () => {
      await expectInvalid({ message: VALID_MESSAGE, signature: '0x' }, 'signature');
    });

    it('should reject numeric value', async () => {
      await expectInvalid({ message: VALID_MESSAGE, signature: 12345 }, 'signature');
    });
  });

  describe('message — IsString + IsNotEmpty', () => {
    it('should reject missing message', async () => {
      await expectInvalid({ signature: VALID_SIGNATURE }, 'message');
    });

    it('should reject empty string message', async () => {
      await expectInvalid({ message: '', signature: VALID_SIGNATURE }, 'message');
    });

    it('should reject numeric message', async () => {
      await expectInvalid({ message: 12345, signature: VALID_SIGNATURE }, 'message');
    });
  });
});
