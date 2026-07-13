/**
 * Fuso horário do app. Study Better é voltado ao público brasileiro; todas as
 * agregações por data (dashboard: hoje/semana/mês; streak) usam este fuso para
 * que a "virada do dia" seja meia-noite de Brasília, não do servidor (UTC no
 * Render). Centralizado aqui para uma única fonte de verdade.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";
