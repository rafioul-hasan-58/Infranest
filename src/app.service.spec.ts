import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  // This block runs before every single test case inside this file
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService], // We tell Nest to load AppService into the test module
    }).compile();

    // We retrieve the instance of AppService from the compiled module
    service = module.get<AppService>(AppService);
  });

  // Test Case 1: Check if the service is defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test Case 2: Check if getHello() returns "Hello World!"
  it('should return "Hello World!"', () => {
    const result = service.getHello();
    expect(result).toBe('Hello World!');
  });
});
