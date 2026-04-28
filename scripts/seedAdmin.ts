import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

async function seedAdmin() {
  const email = "anna.kepczynska@szybkieauto.pl";
  const password = "Flow2024!";
  const name = "Anna Kepczynska";
  
  console.log("Sprawdzam czy użytkownik istnieje...");
  
  const existing = await db.select().from(users).where(eq(users.email, email));
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  if (existing.length > 0) {
    console.log("Użytkownik istnieje, aktualizuję hasło...");
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));
    console.log("Hasło zaktualizowane!");
  } else {
    console.log("Tworzę nowego użytkownika admin...");
    await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: "ADMIN",
      notificationsEnabled: false,
    });
    console.log("Użytkownik utworzony!");
  }
  
  console.log(`\nGotowe! Możesz teraz zalogować się jako:`);
  console.log(`Email: ${email}`);
  console.log(`Hasło: ${password}`);
  
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Błąd:", err);
  process.exit(1);
});
