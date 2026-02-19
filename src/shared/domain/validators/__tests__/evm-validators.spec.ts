import { IsEthereumAddress, validate } from 'class-validator';
import { IsHex } from '../is-hex.validator';
import { IsEvmSignature } from '../is-evm-signature.validator';

class HexDto {
  @IsHex({ evenLength: true })
  value!: string;
}

class HexNoEvenDto {
  @IsHex()
  value!: string;
}

class AddressDto {
  @IsEthereumAddress()
  address!: string;
}

class SignatureDto {
  @IsEvmSignature()
  sig!: string;
}

function make<T extends object>(cls: new () => T, data: Record<string, unknown>): T {
  const inst = new cls();
  Object.assign(inst, data);
  return inst;
}

async function isValid<T extends object>(inst: T): Promise<boolean> {
  const errors = await validate(inst);
  return errors.length === 0;
}

describe('IsHex (evenLength: true)', () => {
  it.each([
    ['0xab', true],
    ['0xABCD', true],
    ['0x00ff00ff', true],
  ])('%s → %s', async (value, expected) => {
    expect(await isValid(make(HexDto, { value }))).toBe(expected);
  });

  it.each([
    ['missing 0x prefix', 'abcd'],
    ['empty string', ''],
    ['just 0x', '0x'],
    ['odd length (3 hex chars)', '0xabc'],
    ['non-hex chars', '0xGGGG'],
    ['spaces', '0x ab cd'],
    ['numeric input', 12345],
  ])('rejects %s', async (_label, value) => {
    expect(await isValid(make(HexDto, { value }))).toBe(false);
  });
});

describe('IsHex (no evenLength constraint)', () => {
  it('accepts odd-length hex when evenLength is not required', async () => {
    expect(await isValid(make(HexNoEvenDto, { value: '0xabc' }))).toBe(true);
  });

  it('still rejects missing 0x prefix', async () => {
    expect(await isValid(make(HexNoEvenDto, { value: 'abc' }))).toBe(false);
  });
});

describe('IsEthereumAddress (class-validator built-in)', () => {
  it.each([
    ['lowercase', '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'],
    ['checksummed', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'],
    ['all uppercase hex', '0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045'],
  ])('accepts valid address (%s)', async (_label, address) => {
    expect(await isValid(make(AddressDto, { address }))).toBe(true);
  });

  it.each([
    ['missing 0x', 'd8da6bf26964af9d7eed9e03e53415d37aa96045'],
    ['too short (39 hex chars)', '0xd8da6bf26964af9d7eed9e03e53415d37aa9604'],
    ['too long (41 hex chars)', '0xd8da6bf26964af9d7eed9e03e53415d37aa960450'],
    ['non-hex chars', '0xd8da6bf26964af9d7eed9e03e53415d37aa9604g'],
    ['empty string', ''],
    ['just 0x', '0x'],
    ['numeric', 42],
  ])('rejects invalid address: %s', async (_label, address) => {
    expect(await isValid(make(AddressDto, { address }))).toBe(false);
  });
});

describe('IsEvmSignature', () => {
  const VALID_SIG = `0x${'ab'.repeat(65)}`;

  it('accepts valid 65-byte signature', async () => {
    expect(await isValid(make(SignatureDto, { sig: VALID_SIG }))).toBe(true);
  });

  it('accepts uppercase hex signature', async () => {
    expect(await isValid(make(SignatureDto, { sig: `0x${'AB'.repeat(65)}` }))).toBe(true);
  });

  it.each([
    ['missing 0x prefix', 'ab'.repeat(65)],
    ['too short (64 bytes)', `0x${'ab'.repeat(64)}`],
    ['too long (66 bytes)', `0x${'ab'.repeat(66)}`],
    ['non-hex chars', `0x${'zz'.repeat(65)}`],
    ['empty string', ''],
    ['just 0x', '0x'],
    ['numeric', 999],
  ])('rejects invalid signature: %s', async (_label, sig) => {
    expect(await isValid(make(SignatureDto, { sig }))).toBe(false);
  });
});
