import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'oldPassword is required!' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'newPassword is required!' })
  newPassword: string;
}
