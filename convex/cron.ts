import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { CronExpressionParser } from "cron-parser";

/**
 * Executa workflows agendados que estão prontos para execução
 * Esta função deve ser chamada periodicamente (usando Convex scheduled functions)
 */
export const executeScheduledWorkflows = internalAction({
  handler: async (ctx) => {
    const now = Date.now();

    // Buscar agendamentos ativos que devem ser executados
    const schedules = await ctx.runQuery(api.schedules.listSchedules, {}) || [];

    const activeSchedules = schedules.filter((s: any) => s.enabled && s.nextRun <= now);

    for (const schedule of activeSchedules) {
      try {
        // Obter workflow
        const workflow = await ctx.runQuery(api.workflows.getWorkflow, {
          id: schedule.workflowId,
        });

        if (workflow) {
          // Executar workflow usando a action existente
          await ctx.runAction(api.openrouter.executeWorkflow, {
            workflowId: schedule.workflowId,
            nodes: workflow.nodes,
            edges: workflow.edges,
            apiKey: workflow.settings.openRouterKey,
          });
        }

        // Atualizar agendamento usando a mutation interna
        await ctx.runMutation(internal.cron.updateScheduleExecution, {
          scheduleId: schedule._id,
          lastRun: now,
        });
      } catch (error) {
        console.error(`Error executing schedule ${schedule._id}:`, error);
      }
    }
  },
});

/**
 * Atualiza a execução de um agendamento (internal mutation)
 */
export const updateScheduleExecution = internalMutation({
  args: {
    scheduleId: v.id("schedules"),
    lastRun: v.number(),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) return;

    // Calcular próxima execução baseado na cron expression
    try {
      const interval = CronExpressionParser.parse(schedule.cronExpression, {
        tz: schedule.timezone,
      });
      interval.next(); // Pular a execução atual
      const nextRun = interval.next().getTime();

      await ctx.db.patch(args.scheduleId, {
        lastRun: args.lastRun,
        nextRun,
        runCount: schedule.runCount + 1,
      });
    } catch (error) {
      console.error(`Error parsing cron expression:`, error);
      // Em caso de erro, agendar para 1 hora depois
      await ctx.db.patch(args.scheduleId, {
        lastRun: args.lastRun,
        nextRun: args.lastRun + (60 * 60 * 1000),
        runCount: schedule.runCount + 1,
      });
    }
  },
});

