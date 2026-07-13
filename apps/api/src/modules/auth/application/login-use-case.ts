import { UnauthorizedError } from "../../../shared/errors/AppError";
import {
  toPublicUser,
  type PublicUser,
  type UserRepository,
} from "../../users/domain/user";
import type { PasswordHasher, TokenService } from "../domain/auth-contracts";

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  user: PublicUser;
  token: string;
}

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute({ email, password }: LoginInput): Promise<LoginOutput> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Consome tempo equivalente ao compare (mesmo custo de bcrypt) para não
      // vazar, por timing, se o e-mail existe ou não.
      await this.hasher.hash(password);
      throw new UnauthorizedError("Credenciais inválidas");
    }

    const passwordMatches = await this.hasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    return { user: toPublicUser(user), token: this.tokens.sign(user.id) };
  }
}
