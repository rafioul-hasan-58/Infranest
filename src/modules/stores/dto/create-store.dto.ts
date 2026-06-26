import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateStoreDto {
    @IsString()
    @IsNotEmpty({ message: "Store name is required!" })
    storeName: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsString()
    @IsNotEmpty({ message: "LogoUrl is required!" })
    logoUrl: string;

    @IsString()
    @IsOptional()
    bannerUrl: string;

    @IsString()
    @IsOptional()
    address: string;

    @IsString()
    @IsOptional()
    phoneNumber: string;
}