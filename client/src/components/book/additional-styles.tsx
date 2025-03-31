import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, PaintBucket, Palette } from 'lucide-react';

export interface StyleOption {
  id: string;
  value: string;
  type: 'style' | 'theme';
}

interface AdditionalStylesProps {
  styles: StyleOption[];
  onChange: (styles: StyleOption[]) => void;
  disabled?: boolean;
}

export const AdditionalStyles: React.FC<AdditionalStylesProps> = ({
  styles,
  onChange,
  disabled = false,
}) => {
  const [newStyle, setNewStyle] = React.useState('');
  const [newTheme, setNewTheme] = React.useState('');
  
  const addStyle = (type: 'style' | 'theme') => {
    const value = type === 'style' ? newStyle : newTheme;
    if (!value.trim()) return;
    
    const newStyleOption: StyleOption = {
      id: Date.now().toString(),
      value: value.trim(),
      type
    };
    
    onChange([...styles, newStyleOption]);
    
    if (type === 'style') {
      setNewStyle('');
    } else {
      setNewTheme('');
    }
  };
  
  const removeStyle = (id: string) => {
    onChange(styles.filter(style => style.id !== id));
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="additional-style" className="flex items-center mb-2">
            <PaintBucket className="h-4 w-4 mr-2 text-indigo-500" />
            Styles d'écriture supplémentaires <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
          </Label>
          <div className="flex space-x-2">
            <Input
              id="additional-style"
              value={newStyle}
              onChange={(e) => setNewStyle(e.target.value)}
              placeholder="Poétique, cinématographique, minimaliste..."
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addStyle('style')}
              disabled={disabled || !newStyle.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="additional-theme" className="flex items-center mb-2">
            <Palette className="h-4 w-4 mr-2 text-indigo-500" />
            Thèmes supplémentaires <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
          </Label>
          <div className="flex space-x-2">
            <Input
              id="additional-theme"
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              placeholder="Voyage, amitié, trahison, politique..."
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addStyle('theme')}
              disabled={disabled || !newTheme.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {styles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {styles.map((style) => (
            <Badge 
              key={style.id} 
              variant={style.type === 'style' ? 'default' : 'secondary'}
              className="flex items-center gap-1 px-3 py-1"
            >
              {style.type === 'style' ? (
                <PaintBucket className="h-3 w-3" />
              ) : (
                <Palette className="h-3 w-3" />
              )}
              {style.value}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStyle(style.id)}
                disabled={disabled}
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};