import { Controller, Get, Param, Query } from '@nestjs/common';
import { EmailConfirmationService } from './email-confirmation.service';

@Controller('email-confirmation')
export class EmailConfirmationController {
  constructor(private emailConfirmationService: EmailConfirmationService) {}

  @Get('/:token')
  async confirm(@Param('token') token: string) {
    console.log(token, 111111111);
    const email = await this.emailConfirmationService.decodeConfirmationToken(
      token,
    );
    await this.emailConfirmationService.confirmEmail(email);
  }
}
