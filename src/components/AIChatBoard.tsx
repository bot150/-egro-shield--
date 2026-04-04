import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Paperclip, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupportChatResponse } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
}

interface AIChatBoardProps {
  // No props needed for now
}

export const AIChatBoard: React.FC<AIChatBoardProps> = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: 'Hello! I am your ErgoShield AI assistant. What is the problem you are facing today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim() || (selectedFile ? 'Shared a document' : ''),
      imageUrl: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = imagePreview;
    const currentFile = selectedFile;
    
    setInput('');
    removeFile();
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      let imageData;
      if (currentImage && currentFile) {
        imageData = {
          data: currentImage.split(',')[1],
          mimeType: currentFile.type
        };
      }

      const responseText = await getSupportChatResponse(userMessage.text, history, imageData);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'I am sorry, I am having trouble connecting right now. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-neutral-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
      <div className="bg-neutral-900 p-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
          <Bot size={24} />
        </div>
        <div>
          <h3 className="font-black text-lg tracking-tight">AI Support Assistant</h3>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Online & Ready to Help</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/50">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm space-y-3 ${
                m.role === 'user' 
                  ? 'bg-neutral-900 text-white rounded-tr-none' 
                  : 'bg-white text-neutral-900 rounded-tl-none border border-neutral-100'
              }`}>
                {m.imageUrl && (
                  <img 
                    src={m.imageUrl} 
                    alt="Uploaded document" 
                    className="max-w-full rounded-xl border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                )}
                <p>{m.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
              <Loader2 size={16} className="animate-spin text-emerald-500" />
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-neutral-100 space-y-4">
        <AnimatePresence>
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg"
            >
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                onClick={removeFile}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 bg-neutral-100 text-neutral-500 rounded-2xl flex items-center justify-center hover:bg-neutral-200 transition-all shadow-sm"
          >
            <Paperclip size={24} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your problem here..."
            className="flex-1 px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedFile)}
            className="w-14 h-14 bg-neutral-900 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neutral-200"
          >
            <Send size={24} />
          </button>
        </div>
        <p className="text-[10px] text-center text-neutral-400 mt-4 font-black uppercase tracking-widest">
          Powered by ErgoShield AI • Secure & Private
        </p>
      </div>
    </div>
  );
};
