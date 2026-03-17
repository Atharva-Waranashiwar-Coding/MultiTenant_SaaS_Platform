import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, ProjectStatus, MemberRole } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // All projects in this org
    const orgProjects = await this.prisma.project.findMany({
      where: { organizationId },
      select: { id: true, status: true, isArchived: true },
    });
    const projectIds = orgProjects.map((p) => p.id);

    const [
      totalMembers,
      activeMembers,
      totalDepartments,
      totalTeams,
      totalInvitations,
      pendingInvitations,
      taskCounts,
      overdueTasks,
      roleDistribution,
      recentAuditCount,
    ] = await Promise.all([
      // Total / active members
      this.prisma.membership.count({ where: { organizationId } }),
      this.prisma.membership.count({ where: { organizationId, isActive: true } }),
      // Departments
      this.prisma.department.count({ where: { organizationId } }),
      // Teams (non-deleted)
      this.prisma.team.count({ where: { organizationId, isDeleted: false } }),
      // Invitations
      this.prisma.invitation.count({ where: { organizationId } }),
      this.prisma.invitation.count({ where: { organizationId, status: 'PENDING' } }),
      // Task status breakdown (non-deleted tasks across all org projects)
      projectIds.length > 0
        ? this.prisma.task.groupBy({
            by: ['status'],
            where: { projectId: { in: projectIds }, isDeleted: false },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      // Overdue tasks (dueDate < now, not done/cancelled)
      projectIds.length > 0
        ? this.prisma.task.count({
            where: {
              projectId: { in: projectIds },
              isDeleted: false,
              dueDate: { lt: now },
              status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
            },
          })
        : Promise.resolve(0),
      // Role distribution
      this.prisma.membership.groupBy({
        by: ['role'],
        where: { organizationId },
        _count: { _all: true },
      }),
      // Audit activity last 30 days
      this.prisma.auditLog.count({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const totalProjects = orgProjects.length;
    const activeProjects = orgProjects.filter(
      (p) => !p.isArchived && p.status === ProjectStatus.ACTIVE,
    ).length;
    const archivedProjects = orgProjects.filter((p) => p.isArchived).length;

    // Task breakdown map
    const taskBreakdown = Object.fromEntries(
      Object.values(TaskStatus).map((s) => [s, 0]),
    );
    for (const row of taskCounts) {
      taskBreakdown[row.status] = row._count._all;
    }
    const totalTasks = Object.values(taskBreakdown).reduce((a, b) => a + b, 0);

    // Role breakdown map
    const roleBreakdown = Object.fromEntries(
      Object.values(MemberRole).map((r) => [r, 0]),
    );
    for (const row of roleDistribution) {
      roleBreakdown[row.role] = row._count._all;
    }

    // Project status breakdown
    const projectStatusBreakdown = Object.fromEntries(
      Object.values(ProjectStatus).map((s) => [s, 0]),
    );
    for (const p of orgProjects) {
      if (!p.isArchived) {
        projectStatusBreakdown[p.status] = (projectStatusBreakdown[p.status] ?? 0) + 1;
      }
    }

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        inactive: totalMembers - activeMembers,
        roleBreakdown,
      },
      teams: { total: totalTeams },
      departments: { total: totalDepartments },
      invitations: { total: totalInvitations, pending: pendingInvitations },
      projects: {
        total: totalProjects,
        active: activeProjects,
        archived: archivedProjects,
        statusBreakdown: projectStatusBreakdown,
      },
      tasks: {
        total: totalTasks,
        overdue: overdueTasks as number,
        statusBreakdown: taskBreakdown,
      },
      activity: {
        recentAuditEvents: recentAuditCount,
      },
    };
  }

  async getTrends(organizationId: string) {
    const now = new Date();

    // Build 6 month buckets
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      months.push({
        label: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        start,
        end,
      });
    }

    const orgProjects = await this.prisma.project.findMany({
      where: { organizationId },
      select: { id: true },
    });
    const projectIds = orgProjects.map((p) => p.id);

    const trendData = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const [newMembers, newProjects, tasksCompleted] = await Promise.all([
          this.prisma.membership.count({
            where: { organizationId, joinedAt: { gte: start, lte: end } },
          }),
          this.prisma.project.count({
            where: { organizationId, createdAt: { gte: start, lte: end } },
          }),
          projectIds.length > 0
            ? this.prisma.task.count({
                where: {
                  projectId: { in: projectIds },
                  isDeleted: false,
                  status: TaskStatus.DONE,
                  updatedAt: { gte: start, lte: end },
                },
              })
            : Promise.resolve(0),
        ]);
        return { label, newMembers, newProjects, tasksCompleted };
      }),
    );

    return { months: trendData };
  }
}
