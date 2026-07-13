import type { Request, Response } from "express";
import type { FinishSessionUseCase } from "../application/finish-session-use-case";
import type { GetActiveSessionUseCase } from "../application/get-active-session-use-case";
import type { ListSessionsUseCase } from "../application/list-sessions-use-case";
import type { PauseSessionUseCase } from "../application/pause-session-use-case";
import type { RegisterStudyUseCase } from "../application/register-study-use-case";
import type { ResetSessionUseCase } from "../application/reset-session-use-case";
import type { ResumeSessionUseCase } from "../application/resume-session-use-case";
import type { StartSessionUseCase } from "../application/start-session-use-case";
import { routeParam } from "../../../shared/utils/route-param";
import { toSessionResponse } from "./session-mapper";
import { listSessionsQuerySchema } from "./study-sessions.schemas";

export class StudySessionsController {
  constructor(
    private readonly startSession: StartSessionUseCase,
    private readonly pauseSession: PauseSessionUseCase,
    private readonly resumeSession: ResumeSessionUseCase,
    private readonly resetSession: ResetSessionUseCase,
    private readonly finishSession: FinishSessionUseCase,
    private readonly getActiveSession: GetActiveSessionUseCase,
    private readonly listSessions: ListSessionsUseCase,
    private readonly registerStudy: RegisterStudyUseCase,
  ) {}

  start = async (req: Request, res: Response): Promise<void> => {
    const session = await this.startSession.execute({
      userId: req.userId!,
      subjectId: req.body.subjectId,
    });
    res.status(201).json({ session: toSessionResponse(session) });
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const session = await this.registerStudy.execute({
      userId: req.userId!,
      subjectId: req.body.subjectId,
      netMinutes: req.body.netMinutes,
      studyDate: req.body.studyDate,
      studyPeriod: req.body.studyPeriod,
      studyMethod: req.body.studyMethod,
      questionsCount: req.body.questionsCount,
      correctCount: req.body.correctCount,
      pagesStudied: req.body.pagesStudied,
      notes: req.body.notes,
    });
    res.status(201).json({ session: toSessionResponse(session) });
  };

  active = async (req: Request, res: Response): Promise<void> => {
    const session = await this.getActiveSession.execute(req.userId!);
    res.json({ session: session ? toSessionResponse(session) : null });
  };

  pause = async (req: Request, res: Response): Promise<void> => {
    const session = await this.pauseSession.execute(req.userId!, routeParam(req, "id"));
    res.json({ session: toSessionResponse(session) });
  };

  resume = async (req: Request, res: Response): Promise<void> => {
    const session = await this.resumeSession.execute(req.userId!, routeParam(req, "id"));
    res.json({ session: toSessionResponse(session) });
  };

  reset = async (req: Request, res: Response): Promise<void> => {
    const session = await this.resetSession.execute(req.userId!, routeParam(req, "id"));
    res.json({ session: toSessionResponse(session) });
  };

  finish = async (req: Request, res: Response): Promise<void> => {
    const session = await this.finishSession.execute({
      userId: req.userId!,
      sessionId: routeParam(req, "id"),
      netMinutes: req.body.netMinutes,
      studyDate: req.body.studyDate,
      studyPeriod: req.body.studyPeriod,
      studyMethod: req.body.studyMethod,
      questionsCount: req.body.questionsCount,
      correctCount: req.body.correctCount,
      pagesStudied: req.body.pagesStudied,
      notes: req.body.notes,
    });
    res.json({ session: toSessionResponse(session) });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { page, pageSize, status } = listSessionsQuerySchema.parse(req.query);
    const result = await this.listSessions.execute({
      userId: req.userId!,
      page,
      pageSize,
      status,
    });
    res.json({
      sessions: result.items.map((session) => toSessionResponse(session)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  };
}
