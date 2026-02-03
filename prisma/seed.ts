import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create users with passwords (password: 123456)
  const defaultPassword = await bcrypt.hash("123456", 10);
  let user1 = await prisma.user.findFirst({ where: { email: "eliezer@example.com" } });
  if (!user1) {
    user1 = await prisma.user.create({
      data: { name: "אליעזר רינגר", email: "eliezer@example.com", password: defaultPassword },
    });
  } else if (!user1.password) {
    await prisma.user.update({
      where: { id: user1.id },
      data: { password: defaultPassword },
    });
  }

  let user2 = await prisma.user.findFirst({ where: { email: "asher@example.com" } });
  if (!user2) {
    user2 = await prisma.user.create({
      data: { name: "אשר הרש", email: "asher@example.com", password: defaultPassword },
    });
  } else if (!user2.password) {
    await prisma.user.update({
      where: { id: user2.id },
      data: { password: defaultPassword },
    });
  }

  // Admin user
  let admin = await prisma.user.findFirst({ where: { email: "admin@crm.com" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: { name: "מנהל מערכת", email: "admin@crm.com", password: defaultPassword, role: "admin" },
    });
  }

  // Create sample customer (skip if exists)
  let customer = await prisma.customer.findFirst({ where: { name: "דוד כהן" } });
  if (!customer) {
    customer = await prisma.customer.create({
    data: {
      name: "דוד כהן",
      primaryPhone: "050-1234567",
      secondaryPhone: "02-1234567",
      settlement: "ירושלים",
      street: "רחוב הרצל",
      houseNumber: "10",
      managerId: user1.id,
      customerStatus: "לקוח",
      donationStatus: "לא הוצע לו להיות שותף",
    },
  });
  }

  // Create sample certification (skip if exists)
  const existingCert = await prisma.certification.findFirst({ where: { company: "טוסטר אובן חברת סאוטר" } });
  if (!existingCert) {
  await prisma.certification.create({
    data: {
      company: "טוסטר אובן חברת סאוטר",
      name: "טוסטר אובן סאוטר 50 ליטר",
      field: "מקפיאים",
      certifiedOn: "מצב שבת",
      status: "מוצר עדיין לא בשוק",
      issueDateHebrew: "כא' אלול תשפ\"ה",
      endDate: new Date("2026-12-31"),
      endDateHebrew: "כא' כסלו תשפ\"ז",
      contactPerson: "משה גבאי",
      userId: user1.id,
    },
  });
  }

  // Create sample task (skip if exists)
  const existingTask = await prisma.task.findFirst({ where: { title: "לבדוק שמוצר הגיע לארץ" } });
  if (!existingTask && customer) {
  await prisma.task.create({
    data: {
      title: "לבדוק שמוצר הגיע לארץ",
      completed: false,
      dueDate: new Date(),
      customerId: customer.id,
      assigneeId: user1.id,
    },
  });
  }

  // Create default saved view for customers
  const existingView = await prisma.savedView.findFirst({ where: { module: "customers" } });
  if (!existingView) {
    await prisma.savedView.create({
      data: { name: "כל הלקוחות", module: "customers" },
    });
  }

  // Legacy: contacts and deals
  const contact1 = await prisma.contact.create({
    data: {
      name: "דוד כהן",
      email: "david@example.com",
      phone: "050-1234567",
      company: "חברה ישראלית",
      position: "מנהל רכש",
    },
  });

  await prisma.deal.createMany({
    data: [
      { title: "פרויקט CRM", value: 50000, stage: "proposal", contactId: contact1.id },
      { title: "ייעוץ אסטרטגי", value: 15000, stage: "lead" },
    ],
  });

  console.log("Seed הושלם בהצלחה!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
