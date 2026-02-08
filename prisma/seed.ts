import { config } from "dotenv";

import { createPopulatedTodo } from "../app/features/todos/infrastructure/todos-factories.server";
import { saveTodoToDatabase } from "../app/features/todos/infrastructure/todos-model.server";
import { createPopulatedUser } from "../app/features/users/infrastructure/users-factories.server";
import { saveUserToDatabase } from "../app/features/users/infrastructure/users-model.server";
import { prisma } from "../app/utils/db.server";

config();

async function seed() {
  console.log("🌱 Seeding...");
  console.time("🌱 Database has been seeded");

  // Clear existing data for idempotent seeding
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

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

  // Seed demo todos
  console.time("📝 Created demo todos");

  const demoTodos = [
    createPopulatedTodo({
      completed: false,
      description:
        "Domain first, pure functions, no framework imports in the domain layer.",
      title: "Learn hexagonal architecture",
    }),
    createPopulatedTodo({
      completed: true,
      description: "Feature slices with domain/infra/application layers.",
      title: "Build a todo app as example",
    }),
    createPopulatedTodo({
      completed: false,
      description: "Ship it to production with Fly.io.",
      title: "Deploy to production",
    }),
  ];

  for (const todo of demoTodos) {
    await saveTodoToDatabase({
      completed: todo.completed,
      description: todo.description,
      title: todo.title,
    });
    console.log(`  ✓ Todo: ${todo.title}`);
  }

  console.timeEnd("📝 Created demo todos");

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
