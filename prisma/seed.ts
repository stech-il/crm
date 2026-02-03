import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const contact1 = await prisma.contact.create({
    data: {
      name: "דוד כהן",
      email: "david@example.com",
      phone: "050-1234567",
      company: "חברה ישראלית",
      position: "מנהל רכש",
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      name: "שרה לוי",
      email: "sara@startup.co.il",
      phone: "052-9876543",
      company: "סטארטאפ טק",
      position: "מנכ\"לית",
    },
  });

  await prisma.deal.createMany({
    data: [
      { title: "פרויקט CRM", value: 50000, stage: "proposal", contactId: contact1.id },
      { title: "ייעוץ אסטרטגי", value: 15000, stage: "lead", contactId: contact2.id },
      { title: "הדרכה", value: 8000, stage: "negotiation", contactId: contact1.id },
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
