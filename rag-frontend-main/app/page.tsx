"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, MessageSquare, FileText, Clock, BookOpen, Users } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface Source {
  source_id: number
  title: string
  authors: string[]
  year: string
  confidence: string
}

interface QueryResponse {
  answer: string
  sources: Source[]
  context: string[]
  query: string
  timestamp: string
}

interface ConversationHistory {
  query: string
  answer: string
}

export default function RAGInterface() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [responses, setResponses] = useState<QueryResponse[]>([])
  const [activeMode, setActiveMode] = useState<"query" | "interactive">("query")
  const [sessionHistory, setSessionHistory] = useState<ConversationHistory[]>([])

  const handleSingleQuery = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          n_results: 5,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const newResponse: QueryResponse = {
        answer: data.answer,
        sources: data.sources,
        context: data.context,
        query: data.query,
        timestamp: new Date().toLocaleTimeString(),
      }

      setResponses([newResponse])
      setQuery("")
    } catch (error) {
      console.error("Error:", error)
      setResponses([
        {
          answer: "Error connecting to the RAG server. Please ensure the FastAPI backend is running on port 8000.",
          sources: [],
          context: [],
          query: query,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInteractiveQuery = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/interactive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          conversation_history: sessionHistory,
          n_results: 5,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const newResponse: QueryResponse = {
        answer: data.answer,
        sources: data.sources,
        context: data.context,
        query: data.query,
        timestamp: new Date().toLocaleTimeString(),
      }

      // Update session history with the new conversation history from backend
      setSessionHistory(data.conversation_history)

      // Convert conversation history to display format
      const displayResponses = data.conversation_history.map((item: ConversationHistory, index: number) => ({
        answer: item.answer,
        sources: index === data.conversation_history.length - 1 ? data.sources : [],
        context: index === data.conversation_history.length - 1 ? data.context : [],
        query: item.query,
        timestamp: index === data.conversation_history.length - 1 ? new Date().toLocaleTimeString() : "Previous",
      }))

      setResponses(displayResponses)
      setQuery("")
    } catch (error) {
      console.error("Error:", error)
      const errorResponse: QueryResponse = {
        answer: "Error connecting to the RAG server. Please ensure the FastAPI backend is running on port 8000.",
        sources: [],
        context: [],
        query: query,
        timestamp: new Date().toLocaleTimeString(),
      }
      setResponses([...responses, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const clearSession = () => {
    setSessionHistory([])
    setResponses([])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Architecture Research RAG</h1>
                <p className="text-sm text-muted-foreground">Query architecture research papers with AI assistance</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                Powered by RAG Pipeline
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Mode Selection */}
          <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "query" | "interactive")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="query" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Single Query</span>
              </TabsTrigger>
              <TabsTrigger value="interactive" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Interactive Session</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Single Query Mode</CardTitle>
                  <CardDescription>Ask a single question about architecture research papers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Enter your query about architecture research..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 min-h-[100px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSingleQuery()
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleSingleQuery} disabled={isLoading || !query.trim()} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Papers
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactive" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Interactive Session</CardTitle>
                    <CardDescription>Have a conversation with follow-up questions</CardDescription>
                  </div>
                  {sessionHistory.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearSession}>
                      Clear Session
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Continue the conversation about architecture research..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 min-h-[100px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleInteractiveQuery()
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleInteractiveQuery} disabled={isLoading || !query.trim()} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Continue Conversation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Results Display */}
          {responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full">
                  <div className="space-y-6">
                    {responses.map((response, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Query {index + 1}
                              </Badge>
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{response.timestamp}</span>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-3">{response.query}</p>
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-md p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Answer</span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {response.answer}
                          </p>
                        </div>

                        {response.sources && response.sources.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Sources</span>
                            </div>
                            <div className="grid gap-2">
                              {response.sources.map((source, sourceIndex) => (
                                <div key={sourceIndex} className="bg-card border rounded-md p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-foreground">{source.title}</p>
                                      {source.authors && source.authors.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Authors: {source.authors.join(", ")}
                                        </p>
                                      )}
                                      <div className="flex items-center space-x-3 mt-1">
                                        <span className="text-xs text-muted-foreground">Year: {source.year}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          Confidence: {source.confidence}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {responses.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Ready to Search Architecture Research</h3>
                <p className="text-muted-foreground">
                  Choose a mode above and enter your query to get started with AI-powered research assistance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
