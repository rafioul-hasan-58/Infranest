import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module], // import PrismaModule so PrismaService is available, and S3Module for S3 uploads
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
