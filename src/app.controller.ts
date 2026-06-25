import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './common/guards/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ✅ PUBLIC route
  // GET http://localhost:4000/
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 🔒 PROTECTED route
  // GET http://localhost:4000/secret
  // Header: Authorization: secret-token
  @UseGuards(AuthGuard)
  @Get('secret')
  getSecret(): string {
    return '🔐 You have access to the secret route!';
  }
}
