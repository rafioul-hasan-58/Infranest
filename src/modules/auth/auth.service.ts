import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  // REGISTER
  async register(dto: RegisterUserDto) {
    const user = await this.usersService.register(dto);
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.activeRole,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return { user: result, ...tokens };
  }

  // LOGIN
  async login(dto: LoginUserDto) {
    const { email, password } = dto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new ForbiddenException('Invalid credentials!');
    }

    const isMatch = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isMatch) {
      throw new ForbiddenException('Invalid credentials!');
    }

    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      user.activeRole,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return { user: result, ...tokens };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    const isPasswordMatched = await this.usersService.validatePassword(
      dto.oldPassword,
      user.password,
    );

    if (!isPasswordMatched) {
      throw new BadRequestException('Invalid credentials!');
    }
    const newHashedPassword = await this.usersService.hashPassword(
      dto.newPassword,
    );

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: newHashedPassword,
      },
    });
  }
}
