import { prisma } from "./src/lib/prisma";

async function main() {
  const customFields = await prisma.customField.findMany();
  console.log("Custom Fields:", JSON.stringify(customFields, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
