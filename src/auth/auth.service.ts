/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (user) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'User already exists',
        });
      }

      const newUser = await this.prisma.user.create({
        data: {
          email: email,
          name: name,
          password: bcrypt.hashSync(password, 10),
        },
      });

      const { password: _, ...userWithoutPassword } = newUser;
      return {
        user: userWithoutPassword,
        token: this.signJWT(userWithoutPassword),
      };
    } catch (error: any) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'User does not exist',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid password',
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token: this.signJWT(userWithoutPassword),
      };
    } catch (error: any) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });
      return { user, token: await this.signJWT(user) };
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
    }
  }
}
