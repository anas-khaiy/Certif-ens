file_path = '/Users/anaskhaiy/Desktop/PFE 4/Service Admin/src/pages/SettingsPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("api.get('/settings/OLLAMA_MODEL')", "api.get('/admin/settings/OLLAMA_MODEL')")
content = content.replace("api.post('/settings/OLLAMA_MODEL'", "api.post('/admin/settings/OLLAMA_MODEL'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("URLs patched successfully!")
