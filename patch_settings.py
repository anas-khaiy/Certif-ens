import re

file_path = '/Users/anaskhaiy/Desktop/PFE 4/Service Admin/src/pages/SettingsPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Cpu to imports
content = content.replace(
    "Save,\n    Shield,\n    Loader2\n} from 'lucide-react';",
    "Save,\n    Shield,\n    Loader2,\n    Cpu\n} from 'lucide-react';"
)

# 2. Add state variables
content = content.replace(
    "const [updatingPassword, setUpdatingPassword] = useState(false);\n\n    const API_BASE_URL",
    "const [updatingPassword, setUpdatingPassword] = useState(false);\n    const [aiModel, setAiModel] = useState('mistral');\n    const [updatingAiModel, setUpdatingAiModel] = useState(false);\n\n    const API_BASE_URL"
)

# 3. Add fetchSettings call to useEffect
content = content.replace(
    "useEffect(() => {\n        fetchProfile();\n    }, []);",
    "useEffect(() => {\n        fetchProfile();\n        fetchSettings();\n    }, []);"
)

# 4. Add fetchSettings function after fetchProfile
fetchSettings_func = """
    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings/OLLAMA_MODEL');
            if (response.data && response.data.value) {
                setAiModel(response.data.value);
            }
        } catch (error) {
            // Ignore if not found
        }
    };
"""
content = content.replace(
    "setLoading(false);\n        }\n    };",
    "setLoading(false);\n        }\n    };\n" + fetchSettings_func
)

# 5. Add handleAiModelSubmit function after handlePasswordSubmit
handleAiModelSubmit_func = """
    const handleAiModelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingAiModel(true);
        try {
            await api.post('/settings/OLLAMA_MODEL', { value: aiModel });
            setMessage({ type: 'success', text: 'Modèle IA mis à jour avec succès !' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du modèle IA' });
        } finally {
            setUpdatingAiModel(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };
"""
content = content.replace(
    "setUpdatingPassword(false);\n            setTimeout(() => setMessage({ type: '', text: '' }), 3000);\n        }\n    };",
    "setUpdatingPassword(false);\n            setTimeout(() => setMessage({ type: '', text: '' }), 3000);\n        }\n    };\n" + handleAiModelSubmit_func
)

# 6. Add UI section before the last two closing divs
ui_section = """
                {/* AI Model Section */}
                <div className="glass p-3 mb-[30px]">
                    <div className="flex items-center gap-3 border-b border-glass-border pb-3 mb-[30px]" style={{ marginBottom: 30 }}>
                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                            <Cpu size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text">Intelligence Artificielle</h3>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Choisir le modèle IA local</p>
                        </div>
                    </div>

                    <form onSubmit={handleAiModelSubmit} className="space-y-3">
                        <div className="form-group mb-4">
                            <label className="form-label text-[10px] uppercase tracking-wider mb-0.5 block">Modèle Ollama (Local)</label>
                            <div className="relative">
                                <select
                                    className="form-input h-8 text-xs bg-surface w-full"
                                    value={aiModel}
                                    onChange={(e) => setAiModel(e.target.value)}
                                >
                                    <option value="mistral">Mistral (7B) - Standard</option>
                                    <option value="qwen2.5:7b">Qwen 2.5 (7B) - Haute qualité / Français</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={updatingAiModel}
                                className="primary px-4 h-7 bg-blue-500 hover:bg-blue-600 text-[10px] font-bold uppercase tracking-wide rounded-md flex items-center gap-2"
                            >
                                {updatingAiModel ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
"""
content = content.replace(
    "                        </div>\n                    </form>\n                </div>\n            </div>\n        </div>",
    "                        </div>\n                    </form>\n                </div>\n" + ui_section + "            </div>\n        </div>"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("SettingsPage.tsx patched successfully!")
