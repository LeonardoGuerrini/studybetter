import { ConflictError } from "../../../shared/errors/AppError";
import { isUniqueViolation } from "../../../shared/utils/is-unique-violation";
import {
  toPublicUser,
  type PublicUser,
  type UserRepository,
} from "../../users/domain/user";
import type { PasswordHasher, TokenService } from "../domain/auth-contracts";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface RegisterOutput {
  user: PublicUser;
  token: string;
}

export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute({ name, email, password }: RegisterInput): Promise<RegisterOutput> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictError("E-mail já cadastrado");
    }

    const passwordHash = await this.hasher.hash(password);
    let user;
    try {
      user = await this.users.create({ name, email, passwordHash });
    } catch (error) {
      // Corrida entre o findByEmail acima e o create (barrado pela @@unique(email)).
      if (isUniqueViolation(error)) {
        throw new ConflictError("E-mail já cadastrado");
      }
      throw error;
    }

    return { user: toPublicUser(user), token: this.tokens.sign(user.id) };
  }
}
