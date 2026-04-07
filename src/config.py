import os

class Config:
    # Embedding model
    EMBEDDING_MODEL = "multi-qa-MiniLM-L6-cos-v1"
    
    # ChromaDB settings
    COLLECTION_NAME = "architecture_research_papers"

    PERSIST_DIRECTORY = "./chroma_db"
    
    # JSONL files - update these paths to match your actual file locations
    JSONL_FILES = [
        "C:\\Users\\Lenovo\\Documents\\GitHub\\Architect-RAG-LLM-Assistant\\chunks\\building_codes_chunks.jsonl",
        "C:\\Users\\Lenovo\\Documents\\GitHub\\Architect-RAG-LLM-Assistant\\chunks\\case_studies_chunks.jsonl",
        "C:\\Users\\Lenovo\\Documents\\GitHub\\Architect-RAG-LLM-Assistant\\chunks\\material_guide_chunks.jsonl",
        "C:\\Users\\Lenovo\\Documents\\GitHub\\Architect-RAG-LLM-Assistant\\chunks\\misc_chunks.jsonl"
    ]
    
    # Ollama settings
    OLLAMA_MODEL = "llama2"
    OLLAMA_BASE_URL = "http://localhost:11434"
    
    # RAG settings
    TOP_K_RESULTS = 5
    CHUNK_SIZE = 512
    CHUNK_OVERLAP = 50
    PREWARM_OLLAMA = True
    TRUNCATE_DOC_CHARS = 1200
    GENERATION_MAX_TOKENS = 256
    SIMILARITY_THRESHOLD = 0.55
    MAX_QUERY_CHARS = 300
    BLOCKED_QUERY_KEYWORDS = [
        "bomb",
        "attack",
        "terror",
        "kill",
        "explosive",
        "malware",
        "hack",
        "virus",
        "child abuse",
        "porn",
        "illegal",
        "suicide"
    ]

config = Config()
