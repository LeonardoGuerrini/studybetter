import type { Request, Response } from "express";
import type { GetProfileUseCase } from "../application/get-profile-use-case";
import type { UpdateProfileUseCase } from "../application/update-profile-use-case";

export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.getProfile.execute(req.userId!);
    res.json({ user });
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const user = await this.updateProfile.execute({
      userId: req.userId!,
      name: req.body.name,
    });
    res.json({ user });
  };
}
