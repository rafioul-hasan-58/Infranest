import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module], // import S3Module for S3 uploads
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
