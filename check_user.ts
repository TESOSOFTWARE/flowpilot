import { prisma } from "./src/lib/prisma";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "admin@architectpro.io" } // Common email from screenshots
  });
  console.log("User Org ID:", (user as any)?.organizationId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
