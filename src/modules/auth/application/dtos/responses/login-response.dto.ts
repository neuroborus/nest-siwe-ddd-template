import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { staticConfig, NodeEnv } from '@/config';

@Exclude()
export class LoginResponseDto {
  @Expose()
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @Expose()
  @Transform(({ value }) => (staticConfig.nodeEnv === NodeEnv.Prod ? undefined : value), {
    toPlainOnly: true,
  })
  @ApiProperty({ description: 'JWT refresh token (hidden in production)' })
  refreshToken!: string;

  @Expose()
  @ApiProperty({
    description: 'Access token TTL in milliseconds',
    example: 900000,
  })
  accessExpireMs!: number;

  @Expose()
  @ApiProperty({
    description: 'Refresh token TTL in milliseconds',
    example: 259200000,
  })
  refreshExpireMs!: number;
}
