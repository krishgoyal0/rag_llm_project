"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, MessageSquare, FileText, Clock, BookOpen, Users, Upload, AlertCircle, CheckCircle, XCircle } from "lucide-react"
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

interface ReportAnalysis {
  fileName: string
  timestamp: string
  goodPoints: string[]
  badPoints: string[]
  summary: string
  rawAnalysis?: string
}

export default function RAGInterface() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [responses, setResponses] = useState<QueryResponse[]>([])
  const [activeMode, setActiveMode] = useState<"query" | "interactive" | "report">("query")
  const [sessionHistory, setSessionHistory] = useState<ConversationHistory[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [reportAnalysis, setReportAnalysis] = useState<ReportAnalysis | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (file: File) => {
    // Validate file type (PDF, DOCX, TXT, etc.)
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/plain"]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt|doc)$/i)) {
      alert("Please upload a valid document file (PDF, DOCX, or TXT)")
      return
    }
    
    setUploadedFile(file)
    setReportAnalysis(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleAnalyzeReport = async () => {
    if (!uploadedFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const response = await fetch("http://localhost:8000/analyze-report", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const analysis: ReportAnalysis = {
        fileName: uploadedFile.name,
        timestamp: new Date().toLocaleTimeString(),
        goodPoints: data.good_points || [],
        badPoints: data.bad_points || [],
        summary: data.summary || "Analysis complete",
        rawAnalysis: data.full_analysis,
      }

      setReportAnalysis(analysis)
    } catch (error) {
      console.error("Error:", error)
      alert("Error analyzing report. Please ensure the backend is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearReport = () => {
    setUploadedFile(null)
    setReportAnalysis(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
          <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "query" | "interactive" | "report")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Single Query</span>
              </TabsTrigger>
              <TabsTrigger value="interactive" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Interactive Session</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Report Analysis</span>
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

            <TabsContent value="report" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Construction Report Analysis</CardTitle>
                  <CardDescription>Upload a construction report for AI-powered analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!reportAnalysis && (
                    <>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragging ? "border-primary bg-primary/5" : "border-border"
                        } ${uploadedFile ? "bg-muted/50" : ""}`}
                      >
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-sm font-medium text-foreground mb-2">
                          {uploadedFile ? uploadedFile.name : "Drag and drop your report here"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {uploadedFile ? "Ready to analyze" : "or click to select a file (PDF, DOCX, or TXT)"}
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileSelect(e.target.files[0])
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse Files
                        </Button>
                      </div>
                      {uploadedFile && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleAnalyzeReport}
                            disabled={isLoading}
                            className="flex-1"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <FileText className="mr-2 h-4 w-4" />
                                Analyze Report
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={clearReport}
                            disabled={isLoading}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </>
                  )}
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

          {/* Report Analysis Results */}
          {reportAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Analysis Results: {reportAnalysis.fileName}</span>
                </CardTitle>
                <CardDescription>Generated at {reportAnalysis.timestamp}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                {reportAnalysis.summary && (
                  <div className="bg-muted/50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Summary</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {reportAnalysis.summary}
                    </p>
                  </div>
                )}

                {/* Good Points */}
                {reportAnalysis.goodPoints.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium text-foreground">Strong Points</h4>
                    </div>
                    <div className="space-y-2">
                      {reportAnalysis.goodPoints.map((point, index) => (
                        <div key={index} className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3">
                          <p className="text-sm text-foreground">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bad Points */}
                {reportAnalysis.badPoints.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <h4 className="font-medium text-foreground">Areas for Improvement</h4>
                    </div>
                    <div className="space-y-2">
                      {reportAnalysis.badPoints.map((point, index) => (
                        <div key={index} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                          <p className="text-sm text-foreground">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={clearReport} className="w-full">
                  Analyze Another Report
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {responses.length === 0 && !reportAnalysis && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {activeMode === "query" && (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2">Ready to Search Architecture Research</h3>
                    <p className="text-muted-foreground">
                      Enter your query above and click "Search Papers" to get started with AI-powered research assistance.
                    </p>
                  </>
                )}
                {activeMode === "interactive" && (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2">Start a Conversation</h3>
                    <p className="text-muted-foreground">
                      Begin with a question and continue the conversation with follow-up queries.
                    </p>
                  </>
                )}
                {activeMode === "report" && (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2">Upload a Construction Report</h3>
                    <p className="text-muted-foreground">
                      Upload a report to get AI analysis of its strengths and areas for improvement.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
