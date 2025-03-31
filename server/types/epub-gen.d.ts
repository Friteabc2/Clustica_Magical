declare module 'epub-gen' {
  interface EpubOptions {
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

  class Epub {
    constructor(options: EpubOptions, outputPath: string);
    promise: Promise<void>;
  }

  export = Epub;
}