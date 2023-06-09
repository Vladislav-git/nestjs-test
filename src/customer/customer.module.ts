import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerResolver } from './customer.resolver';
import { CustomerController } from './customer.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerController],
  providers: [CustomerService, PrismaService, CustomerResolver],
})
export class CustomerModule {}
