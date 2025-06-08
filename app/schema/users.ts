// app/schema/users.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(), // recommended to include an ID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  credits: integer("credits").notNull().default(5),
  convertCredits: integer("convert_credits").notNull().default(20), // this will be correctly mapped
});
