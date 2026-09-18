import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🎉', '😂', '👏', '🚀', '✨', '👋', '💯', '🙌', '😎'];

export function MessageInput({ onSendMessage, onTypingStart, onTypingStop, disabled }) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Typing debounce
    if (!isTypingRef.current && val.trim().length > 0) {
      isTypingRef.current = true;
      if (onTypingStart) onTypingStart();
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (onTypingStop) onTypingStop();
    }, 1500);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setText('');
    setShowEmojiPicker(false);

    // Immediately stop typing
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (onTypingStop) onTypingStop();
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative p-2.5 sm:p-4 bg-slate-900/90 border-t border-slate-800/90 backdrop-blur-md pb-safe">
      {/* Quick Emoji Picker Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 sm:left-4 mb-2 p-2 sm:p-2.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl flex flex-wrap gap-1 sm:gap-1.5 max-w-[calc(100vw-1rem)] sm:max-w-xs z-30 animate-slide-up backdrop-blur-xl">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-800 flex items-center justify-center text-base sm:text-lg hover:scale-125 transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 sm:gap-2 max-w-5xl mx-auto">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`p-2.5 sm:p-2.5 rounded-xl border transition-colors shrink-0 ${
            showEmojiPicker
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
              : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 active:bg-slate-800'
          }`}
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Input Field */}
        <div className="flex-1 relative rounded-2xl bg-slate-950/80 border border-slate-800 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message..."
            className="w-full bg-transparent px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-32"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-2.5 sm:p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 disabled:opacity-40 disabled:pointer-events-none transition-all hover:scale-105 active:scale-95 shrink-0"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
