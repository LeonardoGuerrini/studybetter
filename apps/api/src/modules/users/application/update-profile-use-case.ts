import { NotFoundError } from "../../../shared/errors/AppError";
import {
  toPublicUser,
  type PublicUser,
  type UserRepository,
} from "../domain/user";

interface UpdateProfileInput {
  userId: string;
  name: string;
}

export class UpdateProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute({ userId, name }: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuário");
    }
    const updated = await this.users.updateName(userId, name);
    return toPublicUser(updated);
  }
}
