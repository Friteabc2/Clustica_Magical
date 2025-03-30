import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  chapters: jsonb("chapters").notNull().default([]),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Define chapter and page content structures using zod
export const pageContentSchema = z.object({
  content: z.string().default(""),
  pageNumber: z.number(),
});

export const chapterSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  pages: z.array(pageContentSchema).default([]),
});

export const bookContentSchema = z.object({
  title: z.string(),
  author: z.string(),
  chapters: z.array(chapterSchema).default([]),
});

export type PageContent = z.infer<typeof pageContentSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type BookContent = z.infer<typeof bookContentSchema>;

export const insertBookSchema = createInsertSchema(books).pick({
  title: true,
  author: true,
  chapters: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
