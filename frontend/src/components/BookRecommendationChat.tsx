"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle, Send, X, Loader2, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api, BookWithSimilarity } from "@/lib/api"

interface Message {
  id: string
  type: 'user' | 'bot'
  text: string
  books?: BookWithSimilarity[]
}

export default function BookRecommendationChat() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hi there! 👋 I\'m here to help you discover your next great read. Tell me what kind of book you\'re in the mood for!'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Don't show on landing/login page
  if (pathname === '/') {
    return null
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const results = await api.books.semanticSearch(input, 5)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: results.length > 0
          ? `I found ${results.length} book${results.length > 1 ? 's' : ''} that might interest you:`
          : 'Sorry, I couldn\'t find any books matching your request. Try describing what you\'re looking for differently!',
        books: results.length > 0 ? results : undefined
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: 'Sorry, I encountered an error while searching for books. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full px-6 py-4 shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2 group"
          aria-label="Get book suggestions"
        >
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span className="font-semibold">Find a Book</span>
          <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Discover Books</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary/80 rounded p-1 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>

                  {/* Display book results */}
                  {message.books && message.books.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.books.map((book) => (
                        <Card key={book.id} className="p-3 bg-white">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-sm text-gray-900">{book.title}</h4>
                            {book.summary && (
                              <p className="text-xs text-gray-500">{book.summary}</p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the book you're looking for..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
