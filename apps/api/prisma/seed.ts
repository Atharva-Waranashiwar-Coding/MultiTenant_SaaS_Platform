import {
  PrismaClient,
  MemberRole,
  ProjectStatus,
  TaskStatus,
  Priority,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function daysAgo(n: number): Date {
  return daysFromNow(-n);
}

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ── Users ────────────────────────────────────────────────────────────────────

  const userData = [
    { email: 'alice@demo.com',   firstName: 'Alice',   lastName: 'Chen',       role: MemberRole.OWNER   },
    { email: 'bob@demo.com',     firstName: 'Bob',     lastName: 'Martinez',   role: MemberRole.ADMIN   },
    { email: 'carol@demo.com',   firstName: 'Carol',   lastName: 'Thompson',   role: MemberRole.MANAGER },
    { email: 'dan@demo.com',     firstName: 'Dan',     lastName: 'Patel',      role: MemberRole.MANAGER },
    { email: 'eve@demo.com',     firstName: 'Eve',     lastName: 'Johnson',    role: MemberRole.MEMBER  },
    { email: 'frank@demo.com',   firstName: 'Frank',   lastName: 'Williams',   role: MemberRole.MEMBER  },
    { email: 'grace@demo.com',   firstName: 'Grace',   lastName: 'Lee',        role: MemberRole.MEMBER  },
    { email: 'henry@demo.com',   firstName: 'Henry',   lastName: 'Brown',      role: MemberRole.MEMBER  },
    { email: 'iris@demo.com',    firstName: 'Iris',    lastName: 'Davis',      role: MemberRole.MEMBER  },
    { email: 'jack@demo.com',    firstName: 'Jack',    lastName: 'Wilson',     role: MemberRole.MEMBER  },
    { email: 'karen@demo.com',   firstName: 'Karen',   lastName: 'Moore',      role: MemberRole.MEMBER  },
    { email: 'liam@demo.com',    firstName: 'Liam',    lastName: 'Taylor',     role: MemberRole.MEMBER  },
    { email: 'mia@demo.com',     firstName: 'Mia',     lastName: 'Anderson',   role: MemberRole.MEMBER  },
    { email: 'noah@demo.com',    firstName: 'Noah',    lastName: 'Jackson',    role: MemberRole.MEMBER  },
    { email: 'olivia@demo.com',  firstName: 'Olivia',  lastName: 'White',      role: MemberRole.MEMBER  },
    { email: 'peter@demo.com',   firstName: 'Peter',   lastName: 'Harris',     role: MemberRole.MEMBER  },
    { email: 'quinn@demo.com',   firstName: 'Quinn',   lastName: 'Martin',     role: MemberRole.MEMBER  },
    { email: 'rachel@demo.com',  firstName: 'Rachel',  lastName: 'Garcia',     role: MemberRole.MEMBER  },
    { email: 'sam@demo.com',     firstName: 'Sam',     lastName: 'Rodriguez',  role: MemberRole.MEMBER  },
    { email: 'tina@demo.com',    firstName: 'Tina',    lastName: 'Lewis',      role: MemberRole.MEMBER  },
    { email: 'uma@demo.com',     firstName: 'Uma',     lastName: 'Robinson',   role: MemberRole.MEMBER  },
    { email: 'victor@demo.com',  firstName: 'Victor',  lastName: 'Walker',     role: MemberRole.MEMBER  },
  ];

  const users: Record<string, any> = {};
  for (const u of userData) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, isEmailVerified: true },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        isEmailVerified: true,
      },
    });
  }

  // ── Organization ─────────────────────────────────────────────────────────────

  const org = await prisma.organization.upsert({
    where: { slug: 'demo-corp' },
    update: { name: 'Acme Technologies', description: 'Building the future of work, one sprint at a time.' },
    create: {
      name: 'Acme Technologies',
      slug: 'demo-corp',
      description: 'Building the future of work, one sprint at a time.',
      brandColor: '#6366F1',
      timezone: 'America/New_York',
      defaultInviteRole: MemberRole.MEMBER,
      createdById: users['alice@demo.com'].id,
    },
  });

  // ── Memberships ──────────────────────────────────────────────────────────────

  for (const u of userData) {
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: users[u.email].id, organizationId: org.id } },
      update: { role: u.role },
      create: {
        userId: users[u.email].id,
        organizationId: org.id,
        role: u.role,
        isActive: u.email !== 'uma@demo.com' && u.email !== 'victor@demo.com', // 2 inactive for demo
        joinedAt: daysAgo(Math.floor(Math.random() * 180)),
      },
    });
  }

  // ── Subscription ─────────────────────────────────────────────────────────────

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      plan: SubscriptionPlan.GROWTH,
      status: SubscriptionStatus.ACTIVE,
      seatLimit: 50,
      billingEmail: 'billing@acme.com',
      currentPeriodStart: daysAgo(15),
      currentPeriodEnd: daysFromNow(15),
      features: { advancedAnalytics: true, auditLog: true, customRoles: true, fileAttachments: true },
    },
  });

  // ── Departments ──────────────────────────────────────────────────────────────

  const deptData = [
    { name: 'Engineering',       description: 'Product development, infrastructure, and platform engineering' },
    { name: 'Product',           description: 'Product strategy, roadmap, and design' },
    { name: 'Marketing',         description: 'Brand, growth, and demand generation' },
    { name: 'Sales',             description: 'Revenue, partnerships, and customer success' },
    { name: 'Operations',        description: 'Finance, legal, HR, and internal systems' },
  ];

  const depts: Record<string, any> = {};
  for (const d of deptData) {
    const existing = await prisma.department.findFirst({ where: { name: d.name, organizationId: org.id } });
    if (existing) {
      depts[d.name] = existing;
    } else {
      depts[d.name] = await prisma.department.create({
        data: {
          name: d.name,
          description: d.description,
          organizationId: org.id,
          createdById: users['alice@demo.com'].id,
        },
      });
    }
  }

  // ── Teams ────────────────────────────────────────────────────────────────────

  const teamData = [
    { name: 'Frontend',     dept: 'Engineering', lead: 'carol@demo.com' },
    { name: 'Backend',      dept: 'Engineering', lead: 'dan@demo.com'   },
    { name: 'DevOps',       dept: 'Engineering', lead: 'bob@demo.com'   },
    { name: 'Design',       dept: 'Product',     lead: 'grace@demo.com' },
    { name: 'Growth',       dept: 'Marketing',   lead: 'karen@demo.com' },
    { name: 'Enterprise',   dept: 'Sales',       lead: 'peter@demo.com' },
  ];

  const teams: Record<string, any> = {};
  for (const t of teamData) {
    const existing = await prisma.team.findFirst({ where: { name: t.name, organizationId: org.id } });
    if (existing) {
      teams[t.name] = existing;
    } else {
      teams[t.name] = await prisma.team.create({
        data: {
          name: t.name,
          organizationId: org.id,
          departmentId: depts[t.dept].id,
          createdById: users['alice@demo.com'].id,
        },
      });
    }
  }

  // ── Department memberships ────────────────────────────────────────────────────

  const deptAssignments: { email: string; dept: string; isLead?: boolean }[] = [
    { email: 'carol@demo.com',  dept: 'Engineering', isLead: true  },
    { email: 'dan@demo.com',    dept: 'Engineering', isLead: true  },
    { email: 'eve@demo.com',    dept: 'Engineering'               },
    { email: 'frank@demo.com',  dept: 'Engineering'               },
    { email: 'henry@demo.com',  dept: 'Engineering'               },
    { email: 'iris@demo.com',   dept: 'Engineering'               },
    { email: 'grace@demo.com',  dept: 'Product',     isLead: true  },
    { email: 'liam@demo.com',   dept: 'Product'                   },
    { email: 'mia@demo.com',    dept: 'Product'                   },
    { email: 'karen@demo.com',  dept: 'Marketing',   isLead: true  },
    { email: 'noah@demo.com',   dept: 'Marketing'                 },
    { email: 'olivia@demo.com', dept: 'Marketing'                 },
    { email: 'peter@demo.com',  dept: 'Sales',       isLead: true  },
    { email: 'quinn@demo.com',  dept: 'Sales'                     },
    { email: 'rachel@demo.com', dept: 'Sales'                     },
    { email: 'sam@demo.com',    dept: 'Operations'                },
    { email: 'tina@demo.com',   dept: 'Operations'                },
    { email: 'bob@demo.com',    dept: 'Engineering', isLead: true  },
    { email: 'jack@demo.com',   dept: 'Engineering'               },
  ];

  for (const a of deptAssignments) {
    const exists = await prisma.departmentMember.findFirst({
      where: { userId: users[a.email].id, departmentId: depts[a.dept].id },
    });
    if (!exists) {
      await prisma.departmentMember.create({
        data: {
          userId: users[a.email].id,
          departmentId: depts[a.dept].id,
          isLead: a.isLead ?? false,
        },
      });
    }
  }

  // ── Team memberships ──────────────────────────────────────────────────────────

  const teamAssignments: { email: string; team: string; isLead?: boolean }[] = [
    { email: 'carol@demo.com',  team: 'Frontend',   isLead: true  },
    { email: 'eve@demo.com',    team: 'Frontend'                  },
    { email: 'frank@demo.com',  team: 'Frontend'                  },
    { email: 'iris@demo.com',   team: 'Frontend'                  },
    { email: 'dan@demo.com',    team: 'Backend',    isLead: true  },
    { email: 'henry@demo.com',  team: 'Backend'                   },
    { email: 'jack@demo.com',   team: 'Backend'                   },
    { email: 'bob@demo.com',    team: 'DevOps',     isLead: true  },
    { email: 'grace@demo.com',  team: 'Design',     isLead: true  },
    { email: 'liam@demo.com',   team: 'Design'                    },
    { email: 'mia@demo.com',    team: 'Design'                    },
    { email: 'karen@demo.com',  team: 'Growth',     isLead: true  },
    { email: 'noah@demo.com',   team: 'Growth'                    },
    { email: 'olivia@demo.com', team: 'Growth'                    },
    { email: 'peter@demo.com',  team: 'Enterprise', isLead: true  },
    { email: 'quinn@demo.com',  team: 'Enterprise'                },
    { email: 'rachel@demo.com', team: 'Enterprise'                },
  ];

  for (const a of teamAssignments) {
    const exists = await prisma.teamMember.findFirst({
      where: { userId: users[a.email].id, teamId: teams[a.team].id },
    });
    if (!exists) {
      await prisma.teamMember.create({
        data: {
          userId: users[a.email].id,
          teamId: teams[a.team].id,
          isLead: a.isLead ?? false,
        },
      });
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────────────

  const projectsData = [
    {
      name: 'Platform v3 Redesign',
      description: 'Full redesign of the admin dashboard with new design system and improved UX.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      dueDate: daysFromNow(45),
      tags: ['design', 'ux', 'frontend'],
      owner: 'carol@demo.com',
      members: ['eve@demo.com', 'frank@demo.com', 'grace@demo.com', 'liam@demo.com'],
    },
    {
      name: 'API Gateway Migration',
      description: 'Migrate from monolithic API to microservices gateway with rate limiting and observability.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.URGENT,
      dueDate: daysFromNow(30),
      tags: ['backend', 'infra', 'migration'],
      owner: 'dan@demo.com',
      members: ['henry@demo.com', 'jack@demo.com', 'bob@demo.com'],
    },
    {
      name: 'Q2 Growth Campaign',
      description: 'Multi-channel demand generation campaign targeting mid-market SaaS companies.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      dueDate: daysFromNow(60),
      tags: ['marketing', 'growth', 'campaign'],
      owner: 'karen@demo.com',
      members: ['noah@demo.com', 'olivia@demo.com'],
    },
    {
      name: 'Enterprise Sales Playbook',
      description: 'Build a repeatable sales motion for $50K+ ACV deals.',
      status: ProjectStatus.PLANNING,
      priority: Priority.MEDIUM,
      dueDate: daysFromNow(90),
      tags: ['sales', 'enablement'],
      owner: 'peter@demo.com',
      members: ['quinn@demo.com', 'rachel@demo.com'],
    },
    {
      name: 'Mobile App — iOS',
      description: 'Native iOS companion app for on-the-go task and project management.',
      status: ProjectStatus.PLANNING,
      priority: Priority.MEDIUM,
      dueDate: daysFromNow(120),
      tags: ['mobile', 'ios', 'frontend'],
      owner: 'carol@demo.com',
      members: ['eve@demo.com', 'iris@demo.com', 'grace@demo.com'],
    },
    {
      name: 'SOC 2 Compliance',
      description: 'Achieve SOC 2 Type II certification by end of year.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.URGENT,
      dueDate: daysFromNow(75),
      tags: ['security', 'compliance', 'infra'],
      owner: 'bob@demo.com',
      members: ['sam@demo.com', 'tina@demo.com', 'dan@demo.com'],
    },
    {
      name: 'Data Warehouse Setup',
      description: 'Stand up a centralised analytics warehouse in Snowflake with dbt models.',
      status: ProjectStatus.ON_HOLD,
      priority: Priority.LOW,
      dueDate: daysFromNow(150),
      tags: ['data', 'analytics', 'infra'],
      owner: 'dan@demo.com',
      members: ['henry@demo.com'],
    },
    {
      name: 'Customer Onboarding Revamp',
      description: 'Reduce time-to-value from 14 days to 3 days for new customers.',
      status: ProjectStatus.COMPLETED,
      priority: Priority.HIGH,
      dueDate: daysAgo(5),
      tags: ['cx', 'onboarding', 'product'],
      owner: 'grace@demo.com',
      members: ['liam@demo.com', 'mia@demo.com', 'carol@demo.com'],
    },
  ];

  const taskTemplates: Record<string, { title: string; status: TaskStatus; priority: Priority }[]> = {
    'Platform v3 Redesign': [
      { title: 'Audit existing component library',         status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Define new design tokens (colors, type)',  status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Redesign sidebar navigation',              status: TaskStatus.IN_REVIEW,   priority: Priority.HIGH   },
      { title: 'Redesign dashboard overview page',         status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH   },
      { title: 'Build skeleton loader components',         status: TaskStatus.DONE,        priority: Priority.MEDIUM },
      { title: 'Responsive layout for mobile breakpoints', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM },
      { title: 'Dark mode support',                        status: TaskStatus.TODO,        priority: Priority.LOW    },
      { title: 'Accessibility audit (WCAG AA)',             status: TaskStatus.TODO,        priority: Priority.MEDIUM },
      { title: 'Write Storybook stories for all components',status: TaskStatus.TODO,       priority: Priority.LOW    },
    ],
    'API Gateway Migration': [
      { title: 'Map all existing API endpoints',           status: TaskStatus.DONE,        priority: Priority.URGENT },
      { title: 'Set up Kong gateway in staging',           status: TaskStatus.DONE,        priority: Priority.URGENT },
      { title: 'Migrate /auth routes',                     status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Migrate /organizations routes',            status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH   },
      { title: 'Add rate limiting policies',               status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH   },
      { title: 'Set up distributed tracing (Jaeger)',      status: TaskStatus.TODO,        priority: Priority.MEDIUM },
      { title: 'Load test — 10k req/s baseline',           status: TaskStatus.TODO,        priority: Priority.HIGH   },
      { title: 'Migrate /projects and /tasks routes',      status: TaskStatus.TODO,        priority: Priority.HIGH   },
      { title: 'Cutover production traffic',               status: TaskStatus.TODO,        priority: Priority.URGENT },
    ],
    'Q2 Growth Campaign': [
      { title: 'Define ICP and messaging framework',       status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Write 5 SEO pillar articles',              status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH   },
      { title: 'Set up LinkedIn ad campaigns',             status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM },
      { title: 'Launch email nurture sequence (6-part)',   status: TaskStatus.TODO,        priority: Priority.HIGH   },
      { title: 'Create product demo video',                status: TaskStatus.TODO,        priority: Priority.MEDIUM },
      { title: 'Publish case study — Acme pilot',          status: TaskStatus.TODO,        priority: Priority.MEDIUM },
    ],
    'Enterprise Sales Playbook': [
      { title: 'Document discovery call framework',        status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH   },
      { title: 'Create competitive battle cards',          status: TaskStatus.TODO,        priority: Priority.HIGH   },
      { title: 'Build ROI calculator spreadsheet',         status: TaskStatus.TODO,        priority: Priority.MEDIUM },
      { title: 'Record demo walkthrough videos',           status: TaskStatus.TODO,        priority: Priority.MEDIUM },
    ],
    'Mobile App — iOS': [
      { title: 'Set up Xcode project and CI pipeline',     status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Design app icon and splash screen',        status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM },
      { title: 'Build authentication screens',             status: TaskStatus.TODO,        priority: Priority.HIGH   },
      { title: 'Implement project list view',              status: TaskStatus.TODO,        priority: Priority.HIGH   },
      { title: 'Implement task detail view',               status: TaskStatus.TODO,        priority: Priority.HIGH   },
      { title: 'Push notification support',                status: TaskStatus.TODO,        priority: Priority.MEDIUM },
    ],
    'SOC 2 Compliance': [
      { title: 'Engage external auditor (Drata)',          status: TaskStatus.DONE,        priority: Priority.URGENT },
      { title: 'Document all data flows',                  status: TaskStatus.IN_REVIEW,   priority: Priority.URGENT },
      { title: 'Implement encryption at rest',             status: TaskStatus.DONE,        priority: Priority.URGENT },
      { title: 'Set up SIEM and alerting',                 status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH   },
      { title: 'Access review — revoke stale permissions', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH   },
      { title: 'Penetration test',                         status: TaskStatus.TODO,        priority: Priority.URGENT },
      { title: 'Employee security training',               status: TaskStatus.TODO,        priority: Priority.MEDIUM },
    ],
    'Data Warehouse Setup': [
      { title: 'Provision Snowflake account',              status: TaskStatus.DONE,        priority: Priority.MEDIUM },
      { title: 'Design dimensional model',                 status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM },
      { title: 'Build dbt models for users/orgs',          status: TaskStatus.TODO,        priority: Priority.MEDIUM },
    ],
    'Customer Onboarding Revamp': [
      { title: 'Map current onboarding flow',              status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Identify top 3 drop-off points',           status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Build in-app checklist component',         status: TaskStatus.DONE,        priority: Priority.HIGH   },
      { title: 'Write onboarding email sequence',          status: TaskStatus.DONE,        priority: Priority.MEDIUM },
      { title: 'A/B test new vs old flow',                 status: TaskStatus.DONE,        priority: Priority.HIGH   },
    ],
  };

  const commentTexts = [
    'Looks good to me, approving this.',
    'Can we revisit the approach here? I have some concerns about scalability.',
    'Done — merged and deployed to staging.',
    'Blocked on dependency from the infra team, will follow up tomorrow.',
    'Added a follow-up ticket for the edge cases we discussed.',
    'This is taking longer than expected — updating the estimate.',
    'Reviewed with design, all feedback incorporated.',
    'Nice work! Just a few minor nits in the PR.',
  ];

  for (const pd of projectsData) {
    const existing = await prisma.project.findFirst({
      where: { name: pd.name, organizationId: org.id },
    });

    let project = existing;
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: pd.name,
          description: pd.description,
          status: pd.status,
          priority: pd.priority,
          dueDate: pd.dueDate,
          tags: pd.tags,
          organizationId: org.id,
          ownerId: users[pd.owner].id,
          createdById: users[pd.owner].id,
          isArchived: pd.status === ProjectStatus.COMPLETED,
          archivedAt: pd.status === ProjectStatus.COMPLETED ? daysAgo(3) : null,
        },
      });
    }

    // Project members
    for (const memberEmail of pd.members) {
      const exists = await prisma.projectMember.findFirst({
        where: { projectId: project.id, userId: users[memberEmail].id },
      });
      if (!exists) {
        await prisma.projectMember.create({
          data: { projectId: project.id, userId: users[memberEmail].id },
        });
      }
    }

    // Tasks
    const tasks = taskTemplates[pd.name] ?? [];
    for (const td of tasks) {
      const taskExists = await prisma.task.findFirst({
        where: { title: td.title, projectId: project.id },
      });
      if (taskExists) continue;

      const assigneeEmail = pick([pd.owner, ...pd.members]);
      const task = await prisma.task.create({
        data: {
          title: td.title,
          status: td.status,
          priority: td.priority,
          projectId: project.id,
          assigneeId: users[assigneeEmail].id,
          createdById: users[pd.owner].id,
          dueDate: td.status === TaskStatus.DONE ? daysAgo(Math.floor(Math.random() * 10)) : daysFromNow(Math.floor(Math.random() * 40) + 5),
        },
      });

      // Add 1-2 comments to some tasks
      if (Math.random() > 0.4) {
        const commenterEmail = pick([pd.owner, ...pd.members]);
        await prisma.taskComment.create({
          data: {
            content: pick(commentTexts),
            taskId: task.id,
            userId: users[commenterEmail].id,
          },
        });
      }
    }
  }

  // ── Audit log entries (recent activity) ──────────────────────────────────────

  const aliceId = users['alice@demo.com'].id;
  const auditEntries = [
    { action: 'USER_LOGIN',        userId: aliceId,                          daysBack: 0  },
    { action: 'PROJECT_CREATED',   userId: users['carol@demo.com'].id,       daysBack: 1  },
    { action: 'TASK_CREATED',      userId: users['dan@demo.com'].id,         daysBack: 1  },
    { action: 'MEMBER_INVITED',    userId: aliceId,                          daysBack: 2  },
    { action: 'TASK_STATUS_CHANGED', userId: users['eve@demo.com'].id,       daysBack: 2  },
    { action: 'PROJECT_UPDATED',   userId: users['carol@demo.com'].id,       daysBack: 3  },
    { action: 'MEMBER_ROLE_CHANGED', userId: aliceId,                        daysBack: 3  },
    { action: 'TEAM_MEMBER_ADDED', userId: users['bob@demo.com'].id,         daysBack: 4  },
    { action: 'TASK_COMMENT_ADDED', userId: users['grace@demo.com'].id,      daysBack: 4  },
    { action: 'DEPARTMENT_CREATED', userId: aliceId,                         daysBack: 5  },
    { action: 'MEMBER_ACTIVATED',  userId: aliceId,                          daysBack: 6  },
    { action: 'PROJECT_ARCHIVED',  userId: users['grace@demo.com'].id,       daysBack: 7  },
    { action: 'SUBSCRIPTION_PLAN_CHANGED', userId: aliceId,                  daysBack: 10 },
    { action: 'ORG_UPDATED',       userId: aliceId,                          daysBack: 14 },
    { action: 'USER_SIGNUP',       userId: users['tina@demo.com'].id,        daysBack: 20 },
  ];

  for (const entry of auditEntries) {
    const createdAt = daysAgo(entry.daysBack);
    createdAt.setHours(Math.floor(Math.random() * 8) + 9); // 9am–5pm
    await prisma.auditLog.create({
      data: {
        action: entry.action as any,
        userId: entry.userId,
        organizationId: org.id,
        createdAt,
        meta: {},
      },
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────────

  const notifData = [
    { userId: aliceId, type: 'MEMBER_ADDED',        title: 'New member joined',     body: 'Tina Lewis joined Acme Technologies.' },
    { userId: aliceId, type: 'PROJECT_ASSIGNED',    title: 'Added to project',      body: 'You were added to SOC 2 Compliance.' },
    { userId: aliceId, type: 'TASK_ASSIGNED',       title: 'Task assigned to you',  body: 'Cutover production traffic is now assigned to you.' },
    { userId: aliceId, type: 'INVITE_ACCEPTED',     title: 'Invitation accepted',   body: 'rachel@demo.com accepted your invitation.' },
    { userId: aliceId, type: 'TASK_DUE_SOON',       title: 'Task due soon',         body: 'Penetration test is due in 3 days.' },
  ];

  for (const n of notifData) {
    await prisma.notification.create({
      data: {
        userId: n.userId,
        organizationId: org.id,
        type: n.type as any,
        title: n.title,
        body: n.body,
        isRead: false,
      },
    });
  }

  // ── Done ──────────────────────────────────────────────────────────────────────

  console.log('\n✅ Seed complete!\n');
  console.log('  Login with any of these accounts (password: Password123!):');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  alice@demo.com   → OWNER');
  console.log('  bob@demo.com     → ADMIN');
  console.log('  carol@demo.com   → MANAGER (Engineering lead)');
  console.log('  dan@demo.com     → MANAGER (Backend lead)');
  console.log('  eve@demo.com     → MEMBER  (Frontend team)');
  console.log('  ... and 17 more demo users\n');
  console.log(`  Org: Acme Technologies (slug: demo-corp)`);
  console.log(`  ${projectsData.length} projects, departments, teams seeded`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
