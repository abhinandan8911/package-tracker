import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Very lightweight markdown renderer: bold (**text**) and bullets (•)
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Render inline bold
        const parts = line.split(/\*\*(.+?)\*\*/g);
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--color-muted-foreground)]">•</span>
              <span>{parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)}</span>
            </div>
          );
        }
        if (line === '') return <div key={i} className="h-1" />;
        return (
          <p key={i}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)}
          </p>
        );
      })}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="h-7 w-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5 text-[var(--color-primary-foreground)]" />
      </div>
      <div className="bg-[var(--color-muted)] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="h-2 w-2 rounded-full bg-[var(--color-muted-foreground)] animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-muted-foreground)] animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-muted-foreground)] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['chat-suggestions'],
    queryFn: chatApi.suggestions,
    staleTime: Infinity,
  });

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm your package assistant. Ask me anything about your shipments — like:\n\n• **How many packages are in transit?**\n• **Show me packages going to Texas**\n• **Are there any delivery exceptions?**",
        timestamp: new Date(),
      }]);
    }
  }, [open, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { answer } = await chatApi.ask(trimmed);
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Make sure the server is running and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50',
          open
            ? 'bg-[var(--color-muted)] text-[var(--color-foreground)]'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105'
        )}
        aria-label="Toggle chat assistant"
      >
        {open
          ? <X className="h-5 w-5" />
          : <MessageSquare className="h-6 w-6" />
        }
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed bottom-24 left-4 sm:left-6 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[600px] flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">Package Assistant</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Ask about your shipments</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 space-y-0">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-end gap-2 mb-4',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shrink-0',
                    msg.role === 'assistant'
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-indigo-500'
                  )}>
                    {msg.role === 'assistant'
                      ? <Bot className="h-3.5 w-3.5 text-[var(--color-primary-foreground)]" />
                      : <User className="h-3.5 w-3.5 text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    'max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-sm'
                      : 'bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-bl-sm'
                  )}>
                    {msg.role === 'assistant'
                      ? <RenderMarkdown text={msg.content} />
                      : <p>{msg.content}</p>
                    }
                    <p className={cn(
                      'text-[10px] mt-1',
                      msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-[var(--color-muted-foreground)]'
                    )}>
                      {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Suggested questions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="px-3 pb-2 shrink-0">
                <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-wide font-medium mb-1.5 px-1">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 4).map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)] hover:border-[var(--color-foreground)] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 pb-3 pt-2 border-t border-[var(--color-border)] shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your packages..."
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                aria-label="Send"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />
                }
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
