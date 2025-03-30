import { useState, useRef, useEffect } from 'react';
import { Chapter, PageContent } from '@shared/schema';
import { Button } from '@/components/ui/button';
import EditorToolbar from '@/components/ui/editor-toolbar';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EditorContentProps {
  currentChapter: Chapter | null;
  currentPage: PageContent | null;
  updateContent: (content: string) => void;
  addPage: () => void;
}

export default function EditorContent({ 
  currentChapter, 
  currentPage,
  updateContent,
  addPage
}: EditorContentProps) {
  const [editorContent, setEditorContent] = useState<string>('');
  const quillRef = useRef<ReactQuill>(null);

  // Update editor content when current page changes
  useEffect(() => {
    if (currentPage) {
      setEditorContent(currentPage.content);
    } else {
      setEditorContent('');
    }
  }, [currentPage]);

  // Handle content change
  const handleContentChange = (content: string) => {
    setEditorContent(content);
    updateContent(content);
  };

  // Quill editor modules and formats
  const modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ]
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link', 'image'
  ];

  if (!currentChapter) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun chapitre sélectionné</h3>
          <p className="text-gray-500 mb-4">Créez un nouveau chapitre pour commencer à écrire</p>
          <Button onClick={addPage} className="bg-primary hover:bg-primary/90">
            Créer un chapitre
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <EditorToolbar quillRef={quillRef} addPage={addPage} />
      
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" id="editor-content-area">
        <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8 min-h-[calc(100vh-16rem)]">
          <h1 
            className="text-3xl font-bold mb-6 text-gray-800 font-serif"
          >
            {currentChapter.title}
          </h1>
          
          <div className="editor-content font-serif">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={editorContent}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              className="quill-editor"
            />
          </div>
        </div>
      </div>
    </>
  );
}
