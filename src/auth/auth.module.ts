import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy, RefreshTokenStrategy } from './strategies';
import { JwtModule } from '@nestjs/jwt';
import { EmailConfirmationService } from 'src/email-confirmation/email-confirmation.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    EmailConfirmationService,
    EmailService,
  ],
})
export class AuthModule {}
