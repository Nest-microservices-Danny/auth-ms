/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('Prisma Service');

  constructor() {
    super({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('🚀 Connected to MongoDB successfully');
    } catch (error) {
      this.logger.error('❌ Error connecting to MongoDB', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
