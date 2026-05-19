from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import shutil
import tempfile

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.rag_pipeline import RAGPipeline
from src.config import config

app = FastAPI(title="Architecture RAG API", description="API for Architecture Research Paper RAG System")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
rag = RAGPipeline()

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    sources: list

class ReportAnalysisResponse(BaseModel):
    good_points: list
    bad_points: list
    summary: str
    full_analysis: str = None

@app.post("/query", response_model=QueryResponse)
async def query_research_papers(request: QueryRequest):
    """Process a research query and return answer with sources."""
    try:
        result = rag.query(request.query)
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Architecture RAG API is running"}

@app.post("/analyze-report", response_model=ReportAnalysisResponse)
async def analyze_construction_report(file: UploadFile = File(...)):
    """Analyze a construction report for good and bad points using RAG + Ollama."""
    try:
        # Save the uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text from the file
        text_content = await rag.extract_text_from_file(file_path)
        
        if not text_content:
            raise ValueError("Could not extract text from the uploaded file")
        
        # Analyze the report
        analysis = await rag.analyze_report(text_content)
        
        # Clean up
        shutil.rmtree(temp_dir)
        
        return ReportAnalysisResponse(
            good_points=analysis["good_points"],
            bad_points=analysis["bad_points"],
            summary=analysis["summary"],
            full_analysis=analysis.get("full_analysis")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report analysis failed: {str(e)}")

@app.get("/stats")
async def get_stats():
    """Get database statistics."""
    try:
        stats = rag.db.get_collection_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.post("/init")
async def initialize_database():
    """Initialize the database with research papers."""
    try:
        rag.initialize_database(config.JSONL_FILES)
        return {"message": "Database initialized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database initialization failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # uvicorn.run(app, host="0.0.0.0", port=3000)
    uvicorn.run(app, host="0.0.0.0", port=8000)