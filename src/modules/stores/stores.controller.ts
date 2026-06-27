import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('stores')
export class StoresController {
    constructor(private readonly storeService: StoresService) { }

    // POST: /stores/create-store
    @Post('/create-store')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.CUSTOMER, UserRole.SELLER)
    @ResponseMessage('Store created successfully')
    createStore(
        @Body() dto: CreateStoreDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.storeService.createStore(userId, dto);
    }
}
