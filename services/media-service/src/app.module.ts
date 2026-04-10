import path from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(__dirname, '../../../.env'),
      ],
    }),
    MediaModule,
  ],
})
export class AppModule {}
