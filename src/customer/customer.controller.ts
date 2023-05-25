import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AccessGuard } from 'src/common/guards';

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @UseGuards(AccessGuard)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  async getAllCustomers() {
    return await this.customerService.findAllCustomers();
  }
}
