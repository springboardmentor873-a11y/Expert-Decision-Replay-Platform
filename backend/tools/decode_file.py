import base64, sys, os

if len(sys.argv) > 2:
    path = sys.argv[1]
    data = base64.b64decode(sys.argv[2].encode())
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(data)
    print(f'Written {path}')
