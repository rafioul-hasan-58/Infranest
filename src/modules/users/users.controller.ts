import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetAllUsersQueryDto } from './dto/get-all-users-query.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // POST /user/register
  @Post('/register')
  @HttpCode(201)
  @ResponseMessage('User registered successfully!')
  register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  // GET/user/my-profile
  @Get('/my-profile')
  @UseGuards(AuthGuard)
  @ResponseMessage('My profile fetched successfully')
  myProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.myProfile(userId);
  }
  // PATCH/user/update-profile
  @Patch('/update-profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profileImage'))
  @ResponseMessage('Profile updated successfully')
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB limit
          new FileTypeValidator({
            fileType: /\/(jpeg|png|jpg|webp)$/,
            skipMagicNumbersValidation: true,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(userId, dto, file);
  }

  // GET/user/get-all-users
  @Get('get-all-users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ResponseMessage('All users fetched successfully')
  async getAllUser(@Query() query: GetAllUsersQueryDto) {
    return this.usersService.getAllUser(query);
  }

  // DELETE/user/delete-user
  @Delete('/delete-user/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ResponseMessage('User deleted successfully')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  // GET /user/:id
  @Get(':id')
  @ResponseMessage('User fetched successfully')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // PATCH/add-seller-role
  @Patch('/add-seller-role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ResponseMessage('Seller role added successfully')
  addSellerRole(@CurrentUser('sub') userId: string) {
    return this.usersService.addSellerRole(userId);
  }

  // PATCH/switch-role
  @Patch('/switch-role')
  @UseGuards(AuthGuard)
  @ResponseMessage('Role switched successfully')
  switchRole(@CurrentUser('sub') userId: string) {
    return this.usersService.switchRole(userId);
  }
}
