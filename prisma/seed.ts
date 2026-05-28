import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('1234', 10);
  await prisma.admin.upsert({
    where: { username: 'ammar' },
    update: { passwordHash: adminPass },
    create: { username: 'ammar', passwordHash: adminPass, fullName: 'عمار' }
  });

  console.log('Seed complete. Admin: ammar / 1234. Students list is empty.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
