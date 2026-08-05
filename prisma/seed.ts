// FEATURE_SLOT_BEGIN:testHelpers:todosSeedImports
import { createPopulatedTodo } from "../app/features/todos/infrastructure/todos-factories.server"
import { saveTodoToDatabase } from "../app/features/todos/infrastructure/todos-model.server"
// FEATURE_SLOT_END:testHelpers:todosSeedImports
import { createPopulatedUser } from "../app/features/users/infrastructure/users-factories.server"
import { saveUserToDatabase } from "../app/features/users/infrastructure/users-model.server"
import { prisma } from "../app/utils/db.server"

async function seed() {
  console.log("🌱 Seeding...")
  console.time("🌱 Database has been seeded")

  // Clear existing data for idempotent seeding
  // FEATURE_SLOT_BEGIN:testHelpers:todosSeedCleanup
  await prisma.todo.deleteMany()
  // FEATURE_SLOT_END:testHelpers:todosSeedCleanup
  await prisma.user.deleteMany()

  const demoUsers = [
    createPopulatedUser({ email: "alice@example.com" }),
    createPopulatedUser({ email: "bob@example.com" }),
    createPopulatedUser({ email: "charlie@example.com" }),
  ]

  console.time(`👥 Created ${demoUsers.length} users`)

  for (const user of demoUsers) {
    await saveUserToDatabase(user)
    console.log(`  ✓ ${user.email}`)
  }

  console.timeEnd(`👥 Created ${demoUsers.length} users`)

  // FEATURE_SLOT_BEGIN:testHelpers:todosSeedData
  // Seed demo todos
  console.time("📝 Created demo todos")

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
  ]

  for (const todo of demoTodos) {
    await saveTodoToDatabase({
      completed: todo.completed,
      description: todo.description,
      title: todo.title,
    })
    console.log(`  ✓ Todo: ${todo.title}`)
  }

  console.timeEnd("📝 Created demo todos")
  // FEATURE_SLOT_END:testHelpers:todosSeedData

  console.timeEnd("🌱 Database has been seeded")

  console.log("\n📝 Demo accounts:")
  console.log("  • alice@example.com")
  console.log("  • bob@example.com")
  console.log("  • charlie@example.com")
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
