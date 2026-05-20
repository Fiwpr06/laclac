import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';
import { UsersConsumer } from './users.consumer';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersConsumer],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
