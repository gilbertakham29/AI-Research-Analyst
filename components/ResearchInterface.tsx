import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateResearchResponse } from '../services/geminiService';
import { Message, Attachment, ModelMode } from '../types';
import { processFiles } from '../utils';
import { IconSearch, IconFileText, IconSend, IconPaperclip, IconBot, IconUser, IconX, IconExternalLink, IconSun, IconMoon, IconChart, IconGraph, IconZap } from './Icons';

const ResearchInterface: React.FC = () => {
  // Updated Welcome Message to match the design
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `### Insight Analyst
Welcome to Insight
I am your AI Research Analyst. I can help you with:
**Deep Web Research** with live citations
**PDF Analysis** for executive summaries
**Complex Synthesis** of multiple sources
How can I assist your research today?`,
      timestamp: Date.now()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [modelMode, setModelMode] = useState<ModelMode>('web'); // Default to Web Search as per screenshot implication
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Dark Mode Toggle
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = await processFiles(files);
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMessageText = input;
    const currentMode = modelMode;

    // Create User Message
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      text: userMessageText,
      attachments: currentAttachments,
      timestamp: Date.now(),
    };

    // Optimistic Update
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachments([]); // Clear attachments from "staging" area after sending
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      // API Call
      const response = await generateResearchResponse(
        userMessageText,
        messages, // History *before* this message
        currentAttachments,
        currentMode
      );

      const aiMsg: Message = {
        id: uuidv4(),
        role: 'model',
        text: response.text,
        groundingChunks: response.groundingChunks,
        evidence: response.evidence,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      console.error("Error generating response", error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'model',
        text: "I apologize, but I encountered an error while processing your request. Please check your API key or connection and try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render message text with basic formatting
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-sky-100 break-words">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-sky-200 break-words">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-4 text-slate-950 dark:text-sky-300 break-words">{line.replace('# ', '')}</h1>;
      
      // Bullets
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <li key={i} className="ml-4 pl-2 list-disc marker:text-sky-500 dark:marker:text-sky-400 break-words">
             <span dangerouslySetInnerHTML={{ __html: line.replace(/^[\*-]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </li>
        );
      }
      
      // Normal paragraphs
      if (line.trim() === '') return <div key={i} className="h-2"></div>;
      
      return (
        <p key={i} className="mb-2 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-sky-100 font-semibold break-words">$1</strong>') }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans transition-colors duration-200 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 flex items-center px-4 md:px-6 justify-between backdrop-blur-md sticky top-0 z-10 transition-colors duration-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 p-2 rounded-lg shadow-sm">
            <IconSearch className="w-5 h-5 text-white" />
          </div>
          <div className="block">
            <h1 className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">Research Analyst</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages Container - FIXED: Added overflow handling */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar - Hide on very small screens */}
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border dark:border-none shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-white dark:bg-slate-700 border-slate-200 text-slate-700 dark:text-white' 
                    : 'bg-[#6366f1] text-white border-transparent'
                }`}>
                  {msg.role === 'user' ? <IconUser className="w-4 h-4 md:w-6 md:h-6" /> : <IconBot className="w-4 h-4 md:w-6 md:h-6" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[calc(100%-3rem)] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* Attachments (Sent by User) */}
                  {msg.attachments && msg.attachments.length > 0 && (
                     <div className="flex flex-wrap gap-2 mb-2 w-full">
                        {msg.attachments.map((att, idx) => (
                           <div key={idx} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 flex items-center gap-2 text-xs shadow-sm max-w-full">
                             <IconFileText className="w-3 h-3 md:w-4 md:h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                             <span className="truncate text-slate-700 dark:text-slate-200">{att.name}</span>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Message Text */}
                  <div className={`rounded-2xl text-sm md:text-base shadow-sm transition-colors duration-200 w-full ${msg.role === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-none border border-slate-200 dark:border-transparent p-3 max-w-full' 
                    : 'bg-transparent text-slate-800 dark:text-slate-300 rounded-tl-none p-0 shadow-none max-w-full'
                  }`}>
                    <div className="break-words overflow-wrap-anywhere">
                      {renderFormattedText(msg.text)}
                    </div>
                  </div>

                  {/* EVIDENCE GRAPH COMPONENT - Fixed overflow issues */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-3 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 md:p-4 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                         <IconGraph className="w-4 h-4 md:w-5 md:h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                         <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide truncate">EVIDENCE GRAPH</span>
                         <span className="ml-auto text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">{msg.evidence.length} Claims</span>
                      </div>
                      
                      <div className="space-y-3">
                        {msg.evidence.map((item, idx) => (
                           <div key={idx} className="flex flex-col gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 hover:border-sky-300 dark:hover:border-sky-700 transition-all overflow-hidden">
                             {/* Claim Node */}
                             <div className="w-full">
                               <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Claim</div>
                               <div className="text-sm text-slate-700 dark:text-slate-300 break-words">{item.claim}</div>
                             </div>

                             {/* Source Node */}
                             <div className="w-full bg-slate-50 dark:bg-slate-800 rounded p-2 border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                   <div className={`w-2 h-2 rounded-full ${item.sourceType === 'web' ? 'bg-green-500' : 'bg-red-500'} shrink-0`}></div>
                                   <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase truncate">{item.sourceType} Source</div>
                                </div>
                                <div className="text-xs font-medium text-slate-800 dark:text-sky-100 truncate" title={item.sourceName}>
                                  {item.sourceName}
                                </div>
                                {item.sourceType === 'web' ? (
                                   <a href={item.sourceReference} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 mt-1">
                                     <IconExternalLink className="w-3 h-3 shrink-0" />
                                     <span className="truncate overflow-hidden">{item.sourceReference}</span>
                                   </a>
                                ) : (
                                   <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                      <IconFileText className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{item.sourceReference}</span>
                                   </span>
                                )}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback: Old Grounding Metadata */}
                  {(!msg.evidence || msg.evidence.length === 0) && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-2 w-full overflow-hidden">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">Web Sources</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {msg.groundingChunks.map((chunk, idx) => chunk.web ? (
                          <a 
                            key={idx}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-600/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group shadow-sm overflow-hidden"
                          >
                            <div className="bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 p-1.5 md:p-2 rounded text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors shrink-0">
                               <IconExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                            </div>
                            <div className="overflow-hidden flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 dark:text-sky-100 truncate group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">{chunk.web.title}</div>
                              <div className="text-xs text-slate-500 truncate">{chunk.web.uri}</div>
                            </div>
                          </a>
                        ) : null)}
                      </div>
                    </div>
                  )}
                  
                  <span className="text-xs text-slate-400 dark:text-slate-600 px-1 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
               <div className="flex gap-3">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0 animate-pulse">
                   <IconBot className="w-4 h-4 md:w-6 md:h-6 text-white" />
                 </div>
                 <div className="flex flex-col gap-2 max-w-[calc(100%-3rem)]">
                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl rounded-tl-none w-32 md:w-48 shadow-sm">
                      <div className="flex gap-1 items-center h-6">
                        <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                        <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                        <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {modelMode === 'deep' ? 'Performing deep analysis & graph construction...' : modelMode === 'web' ? 'Searching & synthesizing...' : 'Thinking...'}
                    </span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="max-w-4xl mx-auto">
              <form 
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm flex flex-col gap-3 md:gap-4"
              >
                {/* Text Area */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Ask a research question or summarize the PDF..."
                  className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm md:text-base resize-none overflow-hidden min-h-[40px] break-words"
                  rows={1}
                  disabled={isLoading}
                />

                {/* Attachments List */}
                {attachments.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative group flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-lg shrink-0">
                        <IconFileText className="w-3 h-3 md:w-4 md:h-4 text-sky-600 dark:text-sky-400" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 max-w-[80px] md:max-w-[120px] truncate">{att.name}</span>
                        <button 
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <IconX className="w-2 h-2 md:w-3 md:h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-1 md:gap-3 flex-wrap">
                    {/* File Upload */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf"
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0"
                      title="Upload PDF"
                    >
                      <IconPaperclip className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <div className="hidden md:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    {/* Mode Chips */}
                    <div className="flex gap-1 md:gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setModelMode('fast')}
                        className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 ${
                          modelMode === 'fast'
                            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-300'
                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <IconZap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">Fast</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModelMode('web')}
                        className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 ${
                          modelMode === 'web'
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-300'
                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <IconSearch className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModelMode('deep')}
                        className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 ${
                          modelMode === 'deep'
                            ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300'
                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <IconChart className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">Deep</span>
                      </button>
                    </div>
                  </div>

                  {/* Research Button */}
                  <button 
                    type="submit" 
                    disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-all w-full md:w-auto justify-center shrink-0 ${
                      input.trim() || attachments.length > 0 
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Research</span>
                    <IconSend className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              </form>
              
              <div className="text-center mt-2 md:mt-3">
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                   Gemini 2.5/Pro • Citations included • PDFs supported
                 </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResearchInterface;
