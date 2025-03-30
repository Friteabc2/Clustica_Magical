import { BookContent, Chapter, PageContent } from '@shared/schema';
import { apiRequest } from './queryClient';

/**
 * Utility functions for book storage and retrieval
 */
export const BookStorage = {
  // Local storage key for temporary auto-save
  AUTO_SAVE_KEY: 'clustica_autosave',
  
  // Save book to local storage as auto-save
  saveAutoSave: (bookContent: BookContent): void => {
    try {
      localStorage.setItem(
        BookStorage.AUTO_SAVE_KEY,
        JSON.stringify({
          content: bookContent,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  },
  
  // Check if auto-save exists
  hasAutoSave: (): boolean => {
    return !!localStorage.getItem(BookStorage.AUTO_SAVE_KEY);
  },
  
  // Get auto-save content
  getAutoSave: (): { content: BookContent; timestamp: number } | null => {
    try {
      const data = localStorage.getItem(BookStorage.AUTO_SAVE_KEY);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error retrieving from local storage:', error);
      return null;
    }
  },
  
  // Clear auto-save
  clearAutoSave: (): void => {
    localStorage.removeItem(BookStorage.AUTO_SAVE_KEY);
  },
  
  // Save book to server
  saveBook: async (id: string | undefined, content: BookContent): Promise<any> => {
    try {
      if (id) {
        // Update existing book
        const response = await apiRequest('PUT', `/api/books/${id}/content`, content);
        return response.json();
      } else {
        // Create new book
        const response = await apiRequest('POST', '/api/books', {
          title: content.title,
          author: content.author,
          chapters: content.chapters
        });
        return response.json();
      }
    } catch (error) {
      console.error('Error saving book to server:', error);
      throw error;
    }
  },
  
  // Delete book from server
  deleteBook: async (id: string): Promise<void> => {
    try {
      await apiRequest('DELETE', `/api/books/${id}`);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }
};
