import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDTO } from './dto';
import { Tokens } from './types';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailConfirmationService } from 'src/email-confirmation/email-confirmation.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailConfirmationService: EmailConfirmationService,
  ) {}

  async hashString(data: string) {
    return bcrypt.hash(data, 10);
  }

  async getTokens(userId: string, email: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_ACCESS_TOKEN_SECRET, expiresIn: 60 * 15 },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_REFRESH_TOKEN_SECRET,
          expiresIn: 60 * 60 * 24 * 7,
        },
      ),
    ]);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async signUp(dto: AuthDTO): Promise<Tokens> {
    const hashedPassword = await this.hashString(dto.password);
    const newCustomer = await this.prisma.customer.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });
    const tokens = await this.getTokens(newCustomer.id, newCustomer.email);
    await this.updateRefreshToken(newCustomer.id, tokens.refresh_token);
    await this.emailConfirmationService.sendVerificationLink(newCustomer.email);
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await this.hashString(refreshToken);
    await this.prisma.customer.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: hash,
      },
    });
  }

  async signIn(dto: AuthDTO): Promise<Tokens> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!customer) throw new ForbiddenException('No access');

    const passwordMatches = await bcrypt.compare(
      dto.password,
      customer.password,
    );

    if (!passwordMatches) throw new ForbiddenException('No access');

    const tokens = await this.getTokens(customer.id, customer.email);
    await this.updateRefreshToken(customer.id, tokens.refresh_token);
    return tokens;
  }
  async logout(userId: string) {
    await this.prisma.customer.updateMany({
      where: {
        id: userId,
        refreshToken: {
          not: null,
        },
      },
      data: {
        refreshToken: null,
      },
    });
  }
  async refresh(userId: string, refreshToken: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: userId,
      },
    });

    if (!customer || !customer.refreshToken)
      throw new ForbiddenException('No Access');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      customer.refreshToken,
    );

    if (!refreshTokenMatches) throw new ForbiddenException('No Access');

    const tokens = await this.getTokens(customer.id, customer.email);
    await this.updateRefreshToken(customer.id, tokens.refresh_token);
  }
}
