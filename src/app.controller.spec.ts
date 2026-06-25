import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthGuard } from './common/guards/auth.guard';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const appController = app.get(AppController);
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('getSecret', () => {
    it('should return secret message', () => {
      const appController = app.get(AppController);
      expect(appController.getSecret()).toBe('🔐 You have access to the secret route!');
    });
  });
});
