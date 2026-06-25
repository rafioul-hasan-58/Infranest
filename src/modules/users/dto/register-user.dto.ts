import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsNotEmpty({ message: 'Password should not be empty' })
  password: string;

  @IsEnum(UserRole, {
    message: 'Role must be one of: CUSTOMER, SELLER, ADMIN',
  })
  @IsOptional()
  activeRole?: UserRole;
}
