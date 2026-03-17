import { PrismaClient, MemberRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo super-admin user
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.com' },
    update: {},
    create: {
      email: 'alice@demo.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Admin',
      isEmailVerified: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: {
      email: 'bob@demo.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Member',
      isEmailVerified: true,
    },
  });

  // Create a demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corp',
      slug: 'demo-corp',
      description: 'The main demo organization',
      createdById: alice.id,
    },
  });

  // Alice is OWNER
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: alice.id, organizationId: org.id } },
    update: {},
    create: {
      userId: alice.id,
      organizationId: org.id,
      role: MemberRole.OWNER,
    },
  });

  // Bob is MEMBER
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: bob.id, organizationId: org.id } },
    update: {},
    create: {
      userId: bob.id,
      organizationId: org.id,
      role: MemberRole.MEMBER,
    },
  });

  console.log('✅ Seed complete.');
  console.log('   alice@demo.com / Password123! (OWNER of Demo Corp)');
  console.log('   bob@demo.com   / Password123! (MEMBER of Demo Corp)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
