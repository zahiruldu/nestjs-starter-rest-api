import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../../user/services/user.service';
import { User } from '../../user/entities/user.entity';
import { RegisterInput } from '../dtos/auth-register-input.dto';
import { RegisterOutput } from '../dtos/auth-register-output.dto';
import { LoginOutput } from '../dtos/auth-login-output.dto';
import { AuthToken } from '../dtos/token.dto';
import { TokenUserIdentity } from '../dtos/token.dto';
import { RefreshTokenOutput } from '../dtos/auth-refresh-token-output.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    // The userService will throw Unauthorized in case of invalid username/password.
    const user = await this.userService.validateUsernamePassword(
      username,
      pass,
    );

    return user;
  }

  login(user: User): LoginOutput {
    return <LoginOutput>this.getAuthToken(user);
  }

  async register(input: RegisterInput): Promise<RegisterOutput> {
    return this.userService.createUser(input);
  }

  async refreshToken(
    tokenUser: TokenUserIdentity,
  ): Promise<RefreshTokenOutput> {
    const user = await this.userService.findById(tokenUser.id);
    if (!user) {
      throw new NotFoundException('Invalid user id');
    }

    return <RefreshTokenOutput>this.getAuthToken(user);
  }

  getAuthToken(user: { username: string; id: number }): AuthToken {
    const subject = { sub: user.id };
    const payload = { username: user.username, sub: user.id };

    return {
      refresh_token: this.jwtService.sign(subject, {
        expiresIn: this.configService.get('jwt.refreshTokenExpiresInSec'),
      }),
      access_token: this.jwtService.sign(
        { ...payload, ...subject },
        { expiresIn: this.configService.get('jwt.accessTokenExpiresInSec') },
      ),
    };
  }
}