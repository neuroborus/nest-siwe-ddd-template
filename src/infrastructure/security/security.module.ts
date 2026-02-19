import { Module } from '@nestjs/common';
import { RequestModule } from '@/infrastructure/request';

@Module({
  imports: [RequestModule],
  exports: [RequestModule],
})
export class SecurityModule {}
