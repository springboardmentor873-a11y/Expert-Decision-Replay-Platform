$nodeDir = 'C:\Users\stefi\AppData\Local\Programs\NodeJS'
$env:Path = "$nodeDir;$env:Path"
$frontendDir = 'C:\Users\stefi\.gemini\antigravity\scratch\edrp-milestone4\frontend'

Set-Location $frontendDir
npm run dev -- --host 127.0.0.1 --port 5173
