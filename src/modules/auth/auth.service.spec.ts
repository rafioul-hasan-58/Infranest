import { AuthService } from "./auth.service"
import { UsersService } from "../users/users.service";
import { TokenService } from "./token.service";
import { PrismaService } from "../../prisma/prisma.service";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";


describe("AuthService", () => {
    let service: AuthService;
    let prisma: PrismaService;
    let usersService: UsersService;
    let tokenService: TokenService;

    // 1.mock user service;
    const mockUserService = {
        register: jest.fn(),
        findByEmail: jest.fn(),
        hashPassword: jest.fn(),
        validatePassword: jest.fn()
    }
    // 2.mock prisma service;
    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn()
        }
    }
    // 3.mock token service;
    const mockTokenService = {
        generateTokens: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: UsersService, useValue: mockUserService },
                { provide: TokenService, useValue: mockTokenService }
            ]
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        usersService = module.get<UsersService>(UsersService);
        tokenService = module.get<TokenService>(TokenService);

        // clear all mocks before real test
        jest.clearAllMocks()

    })

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    // register
    describe('register', () => {
        const registerUserDto = {
            fullName: 'testUser',
            email: 'testuser@example.com',
            password: 'Password123',
            activeRole: UserRole.CUSTOMER
        };

        const mockUser = {
            id: 'user-123',
            fullName: 'testUser',
            email: 'testuser@example.com',
            password: 'hashedPassword',
            activeRole: UserRole.CUSTOMER
        };

        const mockTokens = {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123'
        };

        it('should register user and return user info with tokens', async () => {
            // Arrange 
            mockUserService.register.mockResolvedValue(mockUser);
            mockTokenService.generateTokens.mockResolvedValue(mockTokens);

            // act
            const result = await service.register(registerUserDto);
            
            // assert
            const { password, ...expectedUser } = mockUser;
            expect(result).toEqual({ user: expectedUser, ...mockTokens });

            expect(mockUserService.register).toHaveBeenCalledWith(registerUserDto);
            expect(mockTokenService.generateTokens).toHaveBeenCalledWith(
                mockUser.id,
                mockUser.email,
                mockUser.activeRole
            );
        });
    })
    // login
    describe('login', () => {
        const loginUserDto = {
            email: 'testuser@example.com',
            password: 'Password123'
        };
        const mockUser = {
            id: 'user-123',
            email: 'testuser@example.com',
            password: 'hashedOldPassword',
            activeRole: "Role"
        };
        const mockTokens = {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123'
        };

        it('should login user successfully and return user data and tokens', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(mockUser);
            mockUserService.validatePassword.mockResolvedValue(true);
            mockTokenService.generateTokens.mockResolvedValue(mockTokens);

            // Act
            const result = await service.login(loginUserDto);

            // Assert
            const { password, ...expectedUser } = mockUser;
            expect(result).toEqual({ user: expectedUser, ...mockTokens });

            expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
            expect(mockUserService.validatePassword).toHaveBeenCalledWith(
                loginUserDto.password,
                mockUser.password
            );
            expect(mockTokenService.generateTokens).toHaveBeenCalledWith(
                "user-123",
                loginUserDto.email,
                "Role"
            );
        });

        it('should throw ForbiddenException if user is not found', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(null);

            // Act & Assert
            await expect(service.login(loginUserDto)).rejects.toThrow(
                new ForbiddenException('Invalid credentials!')
            );
        });

        it('should throw ForbiddenException if password does not match', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(mockUser);
            mockUserService.validatePassword.mockResolvedValue(false);

            // Act & Assert
            await expect(service.login(loginUserDto)).rejects.toThrow(
                new ForbiddenException('Invalid credentials!')
            );
        });
    })


    // changePassword
    describe('changePassword', () => {
        const changePasswordDto = {
            oldPassword: 'OldPassword123!',
            newPassword: 'NewPassword123!',
        };

        const mockUser = {
            id: 'user-123',
            password: 'hashedOldPassword',
        };

        it('should change password successfully', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockUserService.validatePassword.mockResolvedValue(true);
            mockUserService.hashPassword.mockResolvedValue('hashedNewPassword');
            mockPrismaService.user.update.mockResolvedValue({});

            // Act & Assert
            await expect(
                service.changePassword('user-123', changePasswordDto)
            ).resolves.not.toThrow();

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
            });
            expect(mockUserService.validatePassword).toHaveBeenCalledWith(
                changePasswordDto.oldPassword,
                mockUser.password,
            );
            expect(mockUserService.hashPassword).toHaveBeenCalledWith(
                changePasswordDto.newPassword,
            );
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { password: 'hashedNewPassword' },
            });
        });

        it('should throw NotFoundException if user is not found', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.changePassword('invalid-user', changePasswordDto)
            ).rejects.toThrow(new NotFoundException('User not found!'));
        });

        it('should throw BadRequestException if old password is incorrect', async () => {
            // Arrange
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockUserService.validatePassword.mockResolvedValue(false);

            // Act & Assert
            await expect(
                service.changePassword('user-123', changePasswordDto)
            ).rejects.toThrow(new BadRequestException('Invalid credentials!'));
        });
    })

})