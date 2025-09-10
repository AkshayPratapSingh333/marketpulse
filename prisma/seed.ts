import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const email = process.env.ADMIN_EMAIL
  const plainPassword = process.env.ADMIN_PASSWORD

  if (!email || !plainPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env")
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", password: hashedPassword },
    create: {
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  console.log(`Admin user created/updated: ${email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
