import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(dataSource)],
      inject: [dataSource.KEY],
      useFactory: (db: ConfigType<typeof dataSource>): ConfigType<typeof dataSource> => db,
    }),
  ],
})
export class DatabaseModule {}
