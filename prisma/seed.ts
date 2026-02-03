import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = await bcrypt.hash("123456", 10);

  let admin = await prisma.user.findFirst({ where: { email: "admin@crm.com" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "מנהל מערכת",
        email: "admin@crm.com",
        password: defaultPassword,
        role: "admin",
      },
    });
    console.log("נוצר משתמש אדמין: admin@crm.com / 123456");
  }

  console.log("Seed הושלם בהצלחה!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
