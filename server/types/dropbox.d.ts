// Déclarations de types supplémentaires pour l'API Dropbox

import { Dropbox, files } from 'dropbox';

declare module 'dropbox' {
  namespace files {
    interface FileMetadata {
      // Propriétés supplémentaires retournées par filesDownload qui ne sont pas définies dans les types officiels
      fileBinary?: Buffer;
      fileBlob?: Blob;
      content?: string;
    }
  }
}

// Déclaration pour epub-gen
declare module 'epub-gen' {
  export interface EpubOptions {
    title: string;
    author: string;
    publisher?: string;
    cover?: string;
    content: Array<{
      title: string;
      data: string;
    }>;
    lang?: string;
    tocTitle?: string;
    [key: string]: any;
  }

  export default class Epub {
    constructor(options: EpubOptions, outputPath: string);
    promise: Promise<void>;
  }
}