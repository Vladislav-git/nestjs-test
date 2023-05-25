import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';

type VerificationTokenPayload = {
  email: string;
};

@Injectable()
export class EmailConfirmationService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  sendVerificationLink(email: string) {
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_VERIFICATION_TOKEN_SECRET,
      expiresIn: 60 * 60 * 24 * 7,
    });

    const url = `http://localhost:8080/email-confirmation/${token}`;

    const text = `Welcome to the application. To confirm the email address, click here: ${url}`;

    return this.emailService.sendMail({
      to: email,
      subject: 'Email confirmation',
      text,
    });
  }

  async markEmailAsConfirmed(email: string) {
    return this.prisma.customer.update({
      where: {
        email,
      },
      data: {
        isEmailConfirmed: true,
      },
    });
  }

  async confirmEmail(email: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        email,
      },
    });
    if (customer.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }
    await this.markEmailAsConfirmed(email);
  }

  async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_VERIFICATION_TOKEN_SECRET,
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException();
    } catch (error) {
      console.log(error);
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }
}
