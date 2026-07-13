import { NotFoundError } from "../../../shared/errors/AppError";
import {
  toPublicUser,
  type PublicUser,
  type UserRepository,
} from "../domain/user";

export class GetProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuário");
    }
    return toPublicUser(user);
  }
}
