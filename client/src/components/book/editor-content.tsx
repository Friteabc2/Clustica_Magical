import { useState, useRef, useEffect } from 'react';
import { Chapter, PageContent } from '@shared/schema';
import { Button } from '@/components/ui/button';
import EditorToolbar from '@/components/ui/editor-toolbar';
import { Shield, BookOpen, Info } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EditorContentProps {
  currentChapter: Chapter | null;
  currentPage: PageContent | null;
  updateContent: (content: string) => void;
  addPage: () => void;
  onCoverPage?: () => void;
}

export default function EditorContent({ 
  currentChapter, 
  currentPage,
  updateContent,
  addPage,
  onCoverPage
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

  // Si aucun chapitre ni page de couverture n'est sélectionné
  if (!currentChapter && !currentPage) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun contenu sélectionné</h3>
          <p className="text-gray-500 mb-4">Sélectionnez la couverture ou créez un nouveau chapitre pour commencer à écrire</p>
          <Button onClick={addPage} className="bg-primary hover:bg-primary/90">
            Créer un chapitre
          </Button>
        </div>
      </div>
    );
  }

  // Si la page de couverture est sélectionnée (signalé par currentChapter étant null mais currentPage non null)
  if (!currentChapter && currentPage && currentPage.isCover) {
    return (
      <>
        <EditorToolbar quillRef={quillRef} addPage={addPage} onCoverPage={currentPage?.isCover ? undefined : onCoverPage} />
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" id="editor-content-area">
          <div className="max-w-3xl mx-auto">
            {/* Bannière d'information pour la page de couverture */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-start">
              <Shield className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-primary mb-1">Page de couverture (spéciale)</h3>
                <p className="text-sm text-gray-600">
                  Cette page sera toujours la première de votre livre et ne peut pas être supprimée. 
                  Vous pouvez modifier son contenu textuel uniquement.
                </p>
              </div>
            </div>

            {/* Zone d'édition de la couverture */}
            <div className="bg-gradient-to-b from-primary/5 to-secondary/5 shadow-sm rounded-lg p-8 min-h-[calc(100vh-20rem)]">
              <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-200">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-primary to-secondary rounded-full p-3">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 font-serif border-b pb-4">
                  Page de Couverture
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
          </div>
        </div>
      </>
    );
  }

  // Cas standard: édition d'une page de chapitre
  return (
    <>
      <EditorToolbar quillRef={quillRef} addPage={addPage} onCoverPage={onCoverPage} />
      
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" id="editor-content-area">
        <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8 min-h-[calc(100vh-16rem)]">
          <h1 
            className="text-3xl font-bold mb-6 text-gray-800 font-serif"
          >
            {currentChapter?.title}
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
