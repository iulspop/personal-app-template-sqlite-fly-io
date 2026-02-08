import { config } from "dotenv";

import { createPopulatedUser } from "../app/features/users/users-factories.server";
import { saveUserToDatabase } from "../app/features/users/users-model.server";
import { prisma } from "../app/utils/db.server";

config();

async function seed() {
  console.log("🌱 Seeding...");
  console.time("🌱 Database has been seeded");

  const demoUsers = [
    createPopulatedUser({ email: "alice@example.com", name: "Alice Johnson" }),
    createPopulatedUser({ email: "bob@example.com", name: "Bob Smith" }),
    createPopulatedUser({
      email: "charlie@example.com",
      name: "Charlie Brown",
    }),
  ];

  console.time(`👥 Created ${demoUsers.length} users`);

  for (const user of demoUsers) {
    await saveUserToDatabase(user);
    console.log(`  ✓ ${user.name} (${user.email})`);
  }

  console.timeEnd(`👥 Created ${demoUsers.length} users`);

  console.timeEnd("🌱 Database has been seeded");

  console.log("\n📝 Demo accounts:");
  console.log("  • alice@example.com");
  console.log("  • bob@example.com");
  console.log("  • charlie@example.com");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
