import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class NonceResponseDto {
  @Expose()
  @ApiProperty({ description: 'SIWE nonce challenge', example: 'a1b2c3d4e5f6' })
  nonce!: string;

  @Expose()
  @ApiProperty({ description: 'Nonce expiration timestamp' })
  expiresAt!: Date;
}
