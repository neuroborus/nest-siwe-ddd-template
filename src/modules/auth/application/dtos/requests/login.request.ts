import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import type { Hex } from '@/shared/domain/types';
import { IsEvmSignature } from '@/shared/domain/validators';

export class LoginRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  @ApiProperty({
    description: 'EIP-4361 SIWE message string',
    example:
      'localhost:3000 wants you to sign in with your Ethereum account:\n' +
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\n\n' +
      'Sign in with Ethereum\n\n' +
      'URI: http://localhost:3000\nVersion: 1\nChain ID: 1\n' +
      'Nonce: abc123def456\nIssued At: 2026-02-18T12:00:00.000Z',
  })
  message!: string;

  @IsEvmSignature()
  @ApiProperty({
    description: 'secp256k1 signature (0x-prefixed, 65 bytes / 130 hex chars)',
    example: '0x' + 'a'.repeat(130),
  })
  signature!: Hex;
}
