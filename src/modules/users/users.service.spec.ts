import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { S3Service } from '../s3/s3.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  // 1. Create mock objects for the dependencies
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockTokenService = {
    generateAccessToken: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        // We swap the real PrismaService, TokenService, and S3Service with our mock implementations
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear call history of mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test suite for simple utility methods (bcrypt hashing)
  describe('hashPassword & validatePassword', () => {
    it('should hash a password and validate it successfully', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = await service.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password); // Ensure it's not plain text

      // Check validation
      const isValid = await service.validatePassword(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await service.validatePassword('wrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  // Test suite for finding a user by email
  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', email: 'test@example.com', fullName: 'John Doe' };
      // Arrange: mock findUnique to resolve with our mock user
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  // Test suite for finding one user by ID
  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: 'user-id-123', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-id-123');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange: mock findUnique to resolve with null
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert: Expecting an error
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // Test suite for user registration
  describe('register', () => {
    const registerDto = {
      fullName: 'New User',
      email: 'new@example.com',
      password: 'Password123!',
      activeRole: UserRole.CUSTOMER,
    };

    it('should throw BadRequestException if email already in use', async () => {
      // Arrange: mock user search to return an existing user
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'new@example.com' });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should create and return a new user if email is free', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No existing user
      const mockCreatedUser = {
        id: '2',
        fullName: registerDto.fullName,
        email: registerDto.email,
        activeRole: registerDto.activeRole,
      };
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });
});
