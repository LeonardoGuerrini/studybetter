import { prisma } from "../../../infrastructure/database/prisma";
import type {
  CreateUserData,
  User,
  UserRepository,
} from "../domain/user";

export class PrismaUserRepository implements UserRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  updateName(id: string, name: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { name } });
  }
}
