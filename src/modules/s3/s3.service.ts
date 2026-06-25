import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || '';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || '';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'profiles',
  ): Promise<string> {
    if (!file || !file.buffer) {
      throw new Error('Invalid file object or empty buffer.');
    }

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const key = `${folder}/${crypto.randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
      const urlPrefix = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
      if (!fileUrl.startsWith(urlPrefix)) {
        return; // File is not in our S3 bucket (e.g. default avatar URL or external link)
      }

      const key = fileUrl.replace(urlPrefix, '');

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      // Log the error but don't throw, as failing to delete an old avatar shouldn't block the user profile update
      console.error(`[S3Service] Failed to delete file ${fileUrl}:`, error);
    }
  }
}
