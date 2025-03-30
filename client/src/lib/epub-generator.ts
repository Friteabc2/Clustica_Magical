import { saveAs } from 'file-saver';
import { BookContent } from '@shared/schema';
import { ExportOptions } from './book-types';

/**
 * Utility class for client-side EPUB generation
 * Note: This is a simple implementation, server-side generation is preferred for production
 */
export class EpubGenerator {
  static async exportToEpub(bookId: string, exportOptions: ExportOptions): Promise<void> {
    try {
      // Call the API to generate and download the EPUB
      const response = await fetch(`/api/books/${bookId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportOptions)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Determine filename from Content-Disposition header if available
      let filename = 'book.epub';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      // Save the file using file-saver
      saveAs(blob, filename);
      
      return;
    } catch (error) {
      console.error('Error exporting EPUB:', error);
      throw error;
    }
  }
  
  // Helper method to generate a simple cover as SVG
  static generateCoverSVG(title: string, author: string): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
        <rect width="600" height="800" fill="url(#grad)" />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="300" y="350" font-family="sans-serif" font-size="40" text-anchor="middle" fill="white">${title}</text>
        <text x="300" y="450" font-family="sans-serif" font-size="30" text-anchor="middle" fill="white">par ${author}</text>
      </svg>
    `;
  }
}
