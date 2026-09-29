import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '../../../redis/redis.module.js';
import { Role } from '../../../common/enums/role.enum.js';
import { User } from '../entities/user.entity.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshPayload {
  sub: string;
  jti: string;
}

const REFRESH_BLACKLIST_PREFIX = 'auth:refresh-blacklist:';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(email: string, password: string): Promise<TokenPair & { user: User }> {
    const user = await this.validateCredentials(email, password);
    const tokens = await this.issueTokens(user);
    return { ...tokens, user };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const blacklisted = await this.redis.get(`${REFRESH_BLACKLIST_PREFIX}${payload.jti}`);
    if (blacklisted) throw new UnauthorizedException('Refresh token has been revoked');

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid refresh token');

    await this.blacklistJti(payload.jti);
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      await this.blacklistJti(payload.jti);
    } catch {
      // Already invalid/expired — nothing to revoke.
    }
  }

  private async blacklistJti(jti: string): Promise<void> {
    const refreshTtl = this.config.get<string>('jwt.refreshTtl')!;
    await this.redis.set(`${REFRESH_BLACKLIST_PREFIX}${jti}`, '1', 'EX', parseTtlToSeconds(refreshTtl));
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role as Role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: parseTtlToSeconds(this.config.get<string>('jwt.accessTtl')!),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti: randomUUID() } satisfies RefreshPayload,
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: parseTtlToSeconds(this.config.get<string>('jwt.refreshTtl')!),
      },
    );

    return { accessToken, refreshToken };
  }
}

function parseTtlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 7 * 24 * 60 * 60;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
  return value * multiplier;
}
