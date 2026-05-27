
import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Smile, Bold, Italic, Type } from 'lucide-react';

interface FormattedTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
  '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
  '⚛️', '🆔', '⚡', '🌟', '💫', '⭐', '🌠', '🔥', '💥', '💢'
];

export const FormattedTextInput = ({ 
  value, 
  onChange, 
  placeholder = "Digite sua mensagem...",
  maxLength = 1000
}: FormattedTextInputProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    
    onChange(newValue);
    
    // Manter o cursor após o emoji inserido
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
    
    setShowEmojiPicker(false);
  };

  const insertFormatTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newValue;
    let cursorPos;

    if (selectedText) {
      // Se há texto selecionado, envolver com as tags
      newValue = value.substring(0, start) + `[${tag}]${selectedText}[/${tag}]` + value.substring(end);
      cursorPos = end + tag.length * 2 + 5; // +5 para os colchetes e barra
    } else {
      // Se não há seleção, inserir tags vazias
      newValue = value.substring(0, start) + `[${tag}][/${tag}]` + value.substring(end);
      cursorPos = start + tag.length + 2; // Posicionar cursor entre as tags
    }
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertFormatTag('b')}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertFormatTag('i')}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertFormatTag('u')}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
        >
          <Type className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg p-3 z-50 shadow-lg w-80 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-10 gap-2">
                {EMOJI_LIST.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-8 h-8 text-lg hover:bg-gray-700 rounded flex items-center justify-center transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 min-h-[120px]"
        maxLength={maxLength}
      />
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div>
          <span>Formatação: [b]negrito[/b], [i]itálico[/i], [u]sublinhado[/u]</span>
        </div>
        <span>{value.length}/{maxLength}</span>
      </div>
    </div>
  );
};
