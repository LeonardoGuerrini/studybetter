export interface TokenPayload {
  sub: string;
}

export interface TokenService {
  sign(userId: string): string;
  verify(token: string): TokenPayload;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
