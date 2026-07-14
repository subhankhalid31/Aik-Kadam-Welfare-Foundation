import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in your .env file first.");
    process.exit(1);
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    await db.update(users).set({ role: "admin", isVerified: true }).where(eq(users.email, email));
    console.log(`Existing user ${email} promoted to admin.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(users).values({ name, email, passwordHash, role: "admin", isVerified: true });
    console.log(`Admin account created: ${email}`);
  }
  process.exit(0);
}

main();
