import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading,
  List,
  ListOrdered,
  Image,
  FilePlus,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ReactQuill from 'react-quill';

interface EditorToolbarProps {
  quillRef: React.RefObject<ReactQuill>;
  addPage: () => void;
  onCoverPage?: () => void;
}

export default function EditorToolbar({ quillRef, addPage, onCoverPage }: EditorToolbarProps) {
  // Format handler for simple formatting operations
  const handleFormat = (format: string, value: boolean | string = true) => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    quill.format(format, value);
  };

  // Tooltip component
  const Tooltip = ({ children, tooltip }: { children: React.ReactNode; tooltip: string }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {tooltip}
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-2 bg-white border-b border-gray-200 flex flex-wrap items-center space-x-1">
      <div className="flex items-center space-x-1 mr-3">
        <Tooltip tooltip="Gras">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => handleFormat('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
        </Tooltip>
        
        <Tooltip tooltip="Italique">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => handleFormat('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </Tooltip>
        
        <Tooltip tooltip="Souligné">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => handleFormat('underline')}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
      
      <Separator orientation="vertical" className="h-5 mx-2" />
      
      <div className="flex items-center space-x-1 mr-3">
        <Tooltip tooltip="Titre">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => handleFormat('header', '2')}
          >
            <Heading className="h-4 w-4" />
          </Button>
        </Tooltip>
        
        <Tooltip tooltip="Liste à puces">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => {
              if (!quillRef.current) return;
              const quill = quillRef.current.getEditor();
              const format = quill.getFormat();
              quill.format('list', format.list === 'bullet' ? false : 'bullet');
            }}
          >
            <List className="h-4 w-4" />
          </Button>
        </Tooltip>
        
        <Tooltip tooltip="Liste numérotée">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => {
              if (!quillRef.current) return;
              const quill = quillRef.current.getEditor();
              const format = quill.getFormat();
              quill.format('list', format.list === 'ordered' ? false : 'ordered');
            }}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
      
      <Separator orientation="vertical" className="h-5 mx-2" />
      
      <div className="flex items-center space-x-1">
        {onCoverPage && (
          <Tooltip tooltip="Aller à la page de couverture">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-md bg-gradient-to-r from-primary/10 to-secondary/10 text-primary hover:from-primary/20 hover:to-secondary/20"
              onClick={onCoverPage}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </Tooltip>
        )}
        
        <Tooltip tooltip="Ajouter une image">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => {
              if (!quillRef.current) return;
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection(true);
              
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              input.click();
              
              input.onchange = () => {
                if (!input.files?.length) return;
                
                const file = input.files[0];
                const reader = new FileReader();
                
                reader.onload = (e) => {
                  const result = e.target?.result;
                  if (typeof result === 'string') {
                    quill.insertEmbed(range.index, 'image', result, 'user');
                  }
                };
                
                reader.readAsDataURL(file);
              };
            }}
          >
            <Image className="h-4 w-4" />
          </Button>
        </Tooltip>
        
        <Tooltip tooltip="Ajouter une nouvelle page">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={addPage}
          >
            <FilePlus className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
