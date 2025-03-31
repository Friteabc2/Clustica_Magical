import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, User, Users, Building, Shield, UserPlus } from 'lucide-react';

export interface Character {
  id: string;
  name: string;
  autoGenerateName: boolean;
  description: string;
  alignment: string; // bon, neutre, mauvais
  organization: string;
  role: string; // principal, secondaire, antagoniste
}

interface CharacterOptionsProps {
  characters: Character[];
  onChange: (characters: Character[]) => void;
  disabled?: boolean;
}

export const CharacterOptions: React.FC<CharacterOptionsProps> = ({ 
  characters, 
  onChange,
  disabled = false
}) => {
  const addCharacter = () => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: '',
      autoGenerateName: true,
      description: '',
      alignment: 'neutral',
      organization: '',
      role: 'secondary'
    };
    
    onChange([...characters, newCharacter]);
  };
  
  const removeCharacter = (id: string) => {
    onChange(characters.filter(character => character.id !== id));
  };
  
  const updateCharacter = (id: string, updates: Partial<Character>) => {
    onChange(characters.map(character => 
      character.id === id ? { ...character, ...updates } : character
    ));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base flex items-center">
          <Users className="h-4 w-4 mr-2 text-indigo-500" />
          Personnages
        </Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addCharacter}
          disabled={disabled}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Ajouter un personnage
        </Button>
      </div>
      
      {characters.length === 0 ? (
        <div className="text-sm text-gray-500 italic text-center py-2">
          Aucun personnage défini. L'IA créera des personnages pour votre histoire.
        </div>
      ) : (
        <div className="space-y-6">
          {characters.map((character, index) => (
            <div key={character.id} className="p-4 border rounded-md relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCharacter(character.id)}
                disabled={disabled}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <h4 className="font-medium mb-3">Personnage {index + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`character-name-${character.id}`} className="flex items-center">
                      <User className="h-3 w-3 mr-1 text-indigo-500" />
                      Nom
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`auto-name-${character.id}`}
                        checked={character.autoGenerateName}
                        onCheckedChange={(checked) => 
                          updateCharacter(character.id, { autoGenerateName: !!checked })
                        }
                        disabled={disabled}
                      />
                      <Label 
                        htmlFor={`auto-name-${character.id}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        Générer automatiquement
                      </Label>
                    </div>
                  </div>
                  <Input
                    id={`character-name-${character.id}`}
                    value={character.name}
                    onChange={(e) => updateCharacter(character.id, { name: e.target.value })}
                    placeholder={character.autoGenerateName ? "Nom généré par l'IA" : "Entrez un nom"}
                    disabled={disabled || character.autoGenerateName}
                    className={character.autoGenerateName ? "bg-gray-100" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`character-role-${character.id}`} className="flex items-center">
                    <UserPlus className="h-3 w-3 mr-1 text-indigo-500" />
                    Rôle
                  </Label>
                  <Select
                    value={character.role}
                    onValueChange={(value) => updateCharacter(character.id, { role: value })}
                    disabled={disabled}
                  >
                    <SelectTrigger id={`character-role-${character.id}`}>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Personnage principal</SelectItem>
                      <SelectItem value="secondary">Personnage secondaire</SelectItem>
                      <SelectItem value="antagonist">Antagoniste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor={`character-desc-${character.id}`}>Description</Label>
                <Textarea
                  id={`character-desc-${character.id}`}
                  value={character.description}
                  onChange={(e) => updateCharacter(character.id, { description: e.target.value })}
                  placeholder="Décrivez ce personnage (âge, apparence, personnalité, histoire...)"
                  rows={2}
                  disabled={disabled}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`character-alignment-${character.id}`} className="flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-indigo-500" />
                    Alignement
                  </Label>
                  <Select
                    value={character.alignment}
                    onValueChange={(value) => updateCharacter(character.id, { alignment: value })}
                    disabled={disabled}
                  >
                    <SelectTrigger id={`character-alignment-${character.id}`}>
                      <SelectValue placeholder="Sélectionner un alignement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Bon / Héroïque</SelectItem>
                      <SelectItem value="neutral">Neutre</SelectItem>
                      <SelectItem value="evil">Mauvais / Antagoniste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`character-org-${character.id}`} className="flex items-center">
                    <Building className="h-3 w-3 mr-1 text-indigo-500" />
                    Organisation <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                  </Label>
                  <Input
                    id={`character-org-${character.id}`}
                    value={character.organization}
                    onChange={(e) => updateCharacter(character.id, { organization: e.target.value })}
                    placeholder="Groupe, famille, faction..."
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};