import os
import sys

# Ensure src/ is on the Python path so modules like embedding_utils import correctly
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from database import ResearchPaperDatabase


if __name__ == '__main__':
    print('Initializing ResearchPaperDatabase (may load embedding model)...')
    db = ResearchPaperDatabase()

    print('\nCollection stats:')
    stats = db.get_collection_stats()
    print(stats)

    query = 'fire safety requirements for high-rise buildings'
    print(f"\nRunning sample retrieval for query: {query}\n")
    results = db.query_documents(query, n_results=5)

    if not results:
        print('No results returned (query failed).')
    else:
        docs = results.get('documents', [[]])[0]
        metas = results.get('metadatas', [[]])[0]
        dists = results.get('distances', [[]])[0] if 'distances' in results else [None] * len(docs)

        print(f'Retrieved {len(docs)} documents:')
        for i, (doc, meta, dist) in enumerate(zip(docs, metas, dists)):
            title = meta.get('title', meta.get('source', 'Unknown')) if isinstance(meta, dict) else 'Unknown'
            print(f'---\nDoc #{i+1}: title={title}, distance={dist}')
            snippet = doc[:400].replace('\n', ' ')
            print(snippet)
