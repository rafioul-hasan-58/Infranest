import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, UserRole } from '@prisma/client';
import { TokenService } from '../auth/token.service';
import { S3Service } from '../s3/s3.service';
import { QueryBuilder } from '../../common/builders/query-builder';
import { GetAllUsersQueryDto } from './dto/get-all-users-query.dto';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly s3Service: S3Service,
  ) { }

  // CREATE
  async register(dto: RegisterUserDto) {
    const { fullName, email, password, activeRole } = dto;
    const isUserExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (isUserExists) {
      throw new BadRequestException('This email is already in use!');
    }

    const hashedPassword = await this.hashPassword(password);

    return this.prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        activeRole,
      },
    });
  }

  // FIND BY EMAIL
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  // FIND BY ID
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id
      }
    })
  }

  // HASH PASSWORD
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  // VALIDATE PASSWORD
  async validatePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // READ ONE
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    return user;
  }

  // MY PROFILE
  async myProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        profileImage: true,
        activeRole: true,
        roles: true,
        isVerified: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    return user;
  }
  // UPDATE PROFILE
  async updateProfile(
    id: string,
    dto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException('User not Found!');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.location !== undefined) updateData.location = dto.location;

    if (file) {
      // Clean up previous profile image if it is stored in S3 and is not the default avatar
      if (
        user.profileImage &&
        user.profileImage !== 'https://i.ibb.co.com/7NZkW9fV/Head.jpg'
      ) {
        await this.s3Service.deleteFile(user.profileImage);
      }
      const s3Url = await this.s3Service.uploadFile(file, 'profiles');
      updateData.profileImage = s3Url;
    } else if (dto.profileImage !== undefined) {
      updateData.profileImage = dto.profileImage;
    }

    const result = await this.prisma.user.update({
      where: {
        id,
      },
      data: updateData,
    });
    return result;
  }

  // GET ALL USERS
  async getAllUser(query: GetAllUsersQueryDto) {
    const userQuery = new QueryBuilder(this.prisma.user, query)
      .search(['fullName', 'email', 'location'])
      .filter()
      .paginate()
      .sort()
      .select({
        id: true,
        fullName: true,
        email: true,
        profileImage: true,
        roles: true,
        location: true,
        bio: true,
        activeRole: true,
        isBlocked: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      });

    const [data, meta] = await Promise.all([
      userQuery.execute(),
      userQuery.countTotal(),
    ]);

    return {
      meta,
      data,
    };
  }

  // ON STARTUP SEEDING
  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = 'admin@infranest.com';

    const adminExists = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
      await this.prisma.user.create({
        data: {
          fullName: 'Super Admin',
          email: adminEmail,
          password: hashedPassword,
          activeRole: 'ADMIN',
          roles: ['ADMIN'],
          isVerified: true,
        },
      });
      console.log('✅ Super Admin seeded successfully (admin@infranest.com)');
    } else {
      console.log('ℹ️ Super Admin already exists');
    }
  }

  // DELETE USER
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException('User not Found!');
    }
    await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
  // ADD SELLER ROLE
  async addSellerRole(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    if (user?.roles.includes(UserRole.SELLER)) {
      throw new BadRequestException('You already have seller role!');
    }
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: { push: UserRole.SELLER } },
      select: {
        id: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return result;
  }

  // SWITCH ACCOUNT
  async switchRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    let newRole = user.activeRole;
    switch (user.activeRole) {
      case UserRole.CUSTOMER:
        if (!user.roles.includes(UserRole.SELLER)) {
          throw new ForbiddenException('User does not have seller role!');
        }
        newRole = UserRole.SELLER;
        break;
      case UserRole.SELLER:
        newRole = UserRole.CUSTOMER;
        break;
      default:
        break;
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        activeRole: newRole,
      },
    });
    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
      newRole,
    );

    return {
      message: `Role switched to ${newRole}`,
      activeRole: newRole,
      accessToken,
    };
  }
}
