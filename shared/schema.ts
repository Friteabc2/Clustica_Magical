import { pgTable, text, serial, integer, jsonb, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  firebaseUid: varchar("firebase_uid", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  bio: text("bio"),
  plan: varchar("plan", { length: 50 }).default("free").notNull(),
  booksCreated: integer("books_created").default(0).notNull(),
  aiBooksCreated: integer("ai_books_created").default(0).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => {
  return {
    emailIdx: unique("email_idx").on(table.email),
    firebaseUidIdx: unique("firebase_uid_idx").on(table.firebaseUid),
  };
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverPage: jsonb("cover_page").default(null),
  chapters: jsonb("chapters").notNull().default([]),
  userId: integer("user_id").references(() => users.id),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Define chapter and page content structures using zod
export const pageContentSchema = z.object({
  content: z.string().default(""),
  pageNumber: z.number(),
  isCover: z.boolean().optional().default(false),
  image: z.object({
    url: z.string(),
    style: z.string().optional(),
    aspectRatio: z.enum(['square', 'portrait', 'landscape', 'panoramic']).optional().default('landscape'),
    prompt: z.string().optional(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  }).optional(),
});

export const chapterSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  pages: z.array(pageContentSchema).default([]),
});

export const bookContentSchema = z.object({
  title: z.string(),
  author: z.string(),
  coverPage: z.union([pageContentSchema, z.null()]).optional(),
  chapters: z.array(chapterSchema).default([]),
  userId: z.number().or(z.string()).optional(), // ID de l'utilisateur propriétaire du livre
});

export type PageContent = z.infer<typeof pageContentSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type BookContent = z.infer<typeof bookContentSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firebaseUid: true,
  displayName: true,
  bio: true,
  plan: true,
  booksCreated: true,
  aiBooksCreated: true,
});

export const insertBookSchema = createInsertSchema(books).pick({
  title: true,
  author: true,
  coverPage: true,
  chapters: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
