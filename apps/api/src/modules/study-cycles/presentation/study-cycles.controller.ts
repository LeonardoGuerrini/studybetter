import type { Request, Response } from "express";
import { routeParam } from "../../../shared/utils/route-param";
import type { AdvanceCycleUseCase } from "../application/advance-cycle-use-case";
import type { CreateCycleUseCase } from "../application/create-cycle-use-case";
import type { DeleteCycleUseCase } from "../application/delete-cycle-use-case";
import type { GetActiveCycleUseCase } from "../application/get-active-cycle-use-case";
import type { GetCycleUseCase } from "../application/get-cycle-use-case";
import type { ListCyclesUseCase } from "../application/list-cycles-use-case";
import type { RestartCycleUseCase } from "../application/restart-cycle-use-case";
import type { RestartSubjectUseCase } from "../application/restart-subject-use-case";
import type { SaveCycleUseCase } from "../application/save-cycle-use-case";
import type { SetActiveCycleUseCase } from "../application/set-active-cycle-use-case";
import { toActiveCycleResponse, toCycleResponse } from "./cycle-mapper";

export class StudyCyclesController {
  constructor(
    private readonly listCycles: ListCyclesUseCase,
    private readonly createCycle: CreateCycleUseCase,
    private readonly getCycle: GetCycleUseCase,
    private readonly saveCycle: SaveCycleUseCase,
    private readonly deleteCycle: DeleteCycleUseCase,
    private readonly setActiveCycle: SetActiveCycleUseCase,
    private readonly getActiveCycle: GetActiveCycleUseCase,
    private readonly advanceCycle: AdvanceCycleUseCase,
    private readonly restartCycle: RestartCycleUseCase,
    private readonly restartSubject: RestartSubjectUseCase,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const cycles = await this.listCycles.execute(req.userId!);
    res.json({ cycles });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const cycle = await this.createCycle.execute({
      userId: req.userId!,
      name: req.body.name,
    });
    res.status(201).json({ cycle });
  };

  show = async (req: Request, res: Response): Promise<void> => {
    const cycle = await this.getCycle.execute(req.userId!, routeParam(req, "id"));
    res.json({ cycle: toCycleResponse(cycle) });
  };

  save = async (req: Request, res: Response): Promise<void> => {
    const cycle = await this.saveCycle.execute({
      userId: req.userId!,
      cycleId: routeParam(req, "id"),
      name: req.body.name,
      items: req.body.items,
    });
    res.json({ cycle: toCycleResponse(cycle) });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.deleteCycle.execute(req.userId!, routeParam(req, "id"));
    res.status(204).send();
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const cycle = await this.setActiveCycle.execute(
      req.userId!,
      routeParam(req, "id"),
    );
    res.json({ cycle: toCycleResponse(cycle) });
  };

  active = async (req: Request, res: Response): Promise<void> => {
    const view = await this.getActiveCycle.execute(req.userId!);
    res.json({ cycle: view ? toActiveCycleResponse(view) : null });
  };

  advance = async (req: Request, res: Response): Promise<void> => {
    await this.advanceCycle.execute(req.userId!);
    const view = await this.getActiveCycle.execute(req.userId!);
    res.json({ cycle: view ? toActiveCycleResponse(view) : null });
  };

  restart = async (req: Request, res: Response): Promise<void> => {
    await this.restartCycle.execute(req.userId!);
    const view = await this.getActiveCycle.execute(req.userId!);
    res.json({ cycle: view ? toActiveCycleResponse(view) : null });
  };

  restartItem = async (req: Request, res: Response): Promise<void> => {
    await this.restartSubject.execute({
      userId: req.userId!,
      subjectId: routeParam(req, "subjectId"),
      mode: req.body.mode,
    });
    const view = await this.getActiveCycle.execute(req.userId!);
    res.json({ cycle: view ? toActiveCycleResponse(view) : null });
  };
}
