import os
import re

dirs = [
  'Service Admin/src',
  'Service Formateur/src',
  'Service Apprenant/src'
]

broken_files = []

# Pattern to find 'import {' followed by 'import {' on the next line (ignoring whitespace)
pattern = re.compile(r'import\s*{\s*[\r\n]+\s*import\s*{')

for base_dir in dirs:
    if not os.path.exists(base_dir):
        continue
    for root, _, files in os.walk(base_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if pattern.search(content):
                            broken_files.append(full_path)
                except:
                    pass

print("BROKEN_FILES:")
for f in broken_files:
    print(f)
