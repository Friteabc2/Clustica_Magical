import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { bookContentSchema } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// EPUB generation library
import Epub from 'epub-gen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Temporary directory for storing generated EPUB files
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for book management
  app.get('/api/books', async (req: Request, res: Response) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Failed to fetch books' });
    }
  });

  app.get('/api/books/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.json(book);
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({ message: 'Failed to fetch book' });
    }
  });

  app.get('/api/books/:id/content', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const content = await storage.getBookContent(id);
      if (!content) {
        return res.status(404).json({ message: 'Book content not found' });
      }
      
      res.json(content);
    } catch (error) {
      console.error('Error fetching book content:', error);
      res.status(500).json({ message: 'Failed to fetch book content' });
    }
  });

  app.post('/api/books', async (req: Request, res: Response) => {
    try {
      const bookData = req.body;
      // Initial validation
      if (!bookData.title || !bookData.author) {
        return res.status(400).json({ message: 'Title and author are required' });
      }
      
      // Create default book structure if not provided
      if (!bookData.chapters) {
        bookData.chapters = [];
      }
      
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      console.error('Error creating book:', error);
      res.status(500).json({ message: 'Failed to create book' });
    }
  });

  app.put('/api/books/:id/content', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      // Validate the request body
      const contentResult = bookContentSchema.safeParse(req.body);
      if (!contentResult.success) {
        return res.status(400).json({ 
          message: 'Invalid book content',
          errors: contentResult.error.errors
        });
      }
      
      const updatedBook = await storage.updateBookContent(id, contentResult.data);
      if (!updatedBook) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.json(updatedBook);
    } catch (error) {
      console.error('Error updating book content:', error);
      res.status(500).json({ message: 'Failed to update book content' });
    }
  });

  app.delete('/api/books/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const success = await storage.deleteBook(id);
      if (!success) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ message: 'Failed to delete book' });
    }
  });

  // EPUB export endpoint
  app.post('/api/books/:id/export', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid book ID' });
      }
      
      const content = await storage.getBookContent(id);
      if (!content) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      // Validate export options
      const exportOptionsSchema = z.object({
        language: z.string().default('fr'),
        includeCover: z.boolean().default(true)
      });
      
      const exportOptions = exportOptionsSchema.parse(req.body);
      
      // Generate EPUB
      const filename = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.epub`;
      const outputPath = path.join(tempDir, filename);
      
      // Prepare content for EPUB
      const epubContent = content.chapters.map(chapter => {
        const chapterContent = chapter.pages.map(page => page.content).join('');
        return {
          title: chapter.title,
          data: chapterContent
        };
      });
      
      // Create EPUB with basic content
      const epubOptions = {
        title: content.title,
        author: content.author,
        publisher: 'Clustica Magical',
        content: epubContent,
        lang: exportOptions.language,
        tocTitle: 'Table des matières',
        cover: exportOptions.includeCover ? 
          `data:image/svg+xml;base64,${Buffer.from(`
            <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
              <rect width="600" height="800" fill="url(#grad)" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                </linearGradient>
              </defs>
              <text x="300" y="350" font-family="sans-serif" font-size="40" text-anchor="middle" fill="white">${content.title}</text>
              <text x="300" y="450" font-family="sans-serif" font-size="30" text-anchor="middle" fill="white">par ${content.author}</text>
            </svg>
          `).toString('base64')}` : undefined
      };
      
      await new Promise<void>((resolve, reject) => {
        new Epub(epubOptions, outputPath).promise
          .then(() => resolve())
          .catch(err => reject(err));
      });
      
      // Send the file back to the client
      res.download(outputPath, filename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).json({ message: 'Failed to send EPUB file' });
        }
        
        // Clean up the file after sending
        fs.unlink(outputPath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temporary file:', unlinkErr);
        });
      });
    } catch (error) {
      console.error('Error exporting book to EPUB:', error);
      res.status(500).json({ message: 'Failed to export book to EPUB' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
