import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerMiddleware } from './common/middlewares/logger-middleware';
import { AuthController } from './modules/auth/auth.controller';
import { StoresModule } from './modules/stores/stores.module';

@Module({
  imports: [
    // Load .env globally — isGlobal means you don't need to import ConfigModule in every feature module
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    StoresModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        { path: '/auth/register', method: RequestMethod.POST },
        // 'auth/{*splat}'
      )
      .forRoutes(AuthController)
  }
}
