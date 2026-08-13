import { PrismaClient } from "@prisma/client";
import { MENU_SEED } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${MENU_SEED.length} menu items...`);
  for (const item of MENU_SEED) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
