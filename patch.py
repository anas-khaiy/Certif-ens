with open('/Users/anaskhaiy/Desktop/PFE 4/Service Formateur/src/pages/CourseEditorPage.tsx', 'r') as f:
    content = f.read()

target = """                                <button
                                    onClick={() => setCourse(prev => ({ ...prev, published: !prev.published }))}
                                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all border-2 text-sm ${course.published
                                        ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white'
                                        : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-white'
                                        }`}
                                >
                                    {course.published ? <Globe size={18} /> : <Lock size={18} />}
                                    <span className="hidden sm:inline">{course.published ? 'Publié' : 'Brouillon'}</span>
                                </button>
                            </>
                        )}"""

replacement = """                                <button
                                    onClick={() => setCourse(prev => ({ ...prev, published: !prev.published }))}
                                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all border-2 text-sm ${course.published
                                        ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white'
                                        : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-white'
                                        }`}
                                >
                                    {course.published ? <Globe size={18} /> : <Lock size={18} />}
                                    <span className="hidden sm:inline">{course.published ? 'Publié' : 'Brouillon'}</span>
                                </button>
                                <button
                                    onClick={() => setCourse(prev => ({ ...prev, contentCompleted: !(prev as any).contentCompleted }))}
                                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all border-2 text-sm ${(course as any).contentCompleted
                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white'
                                        : 'bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500 hover:text-white'
                                        }`}
                                    title="Marquer le contenu comme terminé pour autoriser les certificats"
                                >
                                    {(course as any).contentCompleted ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                                    <span className="hidden sm:inline">{(course as any).contentCompleted ? 'Contenu Terminé' : 'En Création'}</span>
                                </button>
                            </>
                        )}"""

if target in content:
    with open('/Users/anaskhaiy/Desktop/PFE 4/Service Formateur/src/pages/CourseEditorPage.tsx', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success")
else:
    print("Target not found")
