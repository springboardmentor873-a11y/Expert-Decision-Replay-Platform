$python = 'C:\Users\stefi\AppData\Local\Programs\Python\Python311\python.exe'
$backendDir = 'C:\Users\stefi\.gemini\antigravity\scratch\edrp-milestone4\Backend'

Set-Location $backendDir
& $python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
