from ollama import Client
import time

c = Client(host='http://localhost:11434')
print('Pinging Ollama with a short prompt...')
for i in range(2):
    t0 = time.time()
    try:
        r = c.chat(model='llama2', messages=[{'role':'user','content':'Hello'}])
        elapsed = time.time()-t0
        print(f'Attempt {i+1}: elapsed={elapsed:.2f}s')
        print('Reply snippet:', r.get('message', {}).get('content', '')[:200])
    except Exception as e:
        print(f'Attempt {i+1}: failed: {e}')
        break
