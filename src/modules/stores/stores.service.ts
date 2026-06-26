import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class StoresService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UsersService
    ) { }


    async createStore(userId: string, dto: CreateStoreDto) {
        const user = await this.userService.findById(
            userId
        );

        if (!user) {
            throw new NotFoundException('User not Found!');
        }

        const result = await this.prisma.store.create({
            data: {
                ownerId: userId,
                ...dto
            }
        });
        await this.userService.addSellerRole(userId);

        return result
    }
}


