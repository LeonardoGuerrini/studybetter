import jwt, { type JwtPayload } from "jsonwebtoken";
import { AUTH_TOKEN_TTL_DAYS } from "../../../shared/constants/auth";
import type { TokenPayload, TokenService } from "../domain/auth-contracts";

export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  sign(userId: string): string {
    return jwt.sign({}, this.secret, {
      subject: userId,
      expiresIn: `${AUTH_TOKEN_TTL_DAYS}d`,
    });
  }

  verify(token: string): TokenPayload {
    // Algoritmo fixado (HS256): impede aceitar tokens assinados com outro alg.
    const decoded = jwt.verify(token, this.secret, {
      algorithms: ["HS256"],
    }) as JwtPayload;
    if (!decoded.sub) {
      throw new Error("Token sem subject");
    }
    return { sub: decoded.sub };
  }
}
