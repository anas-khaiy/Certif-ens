with open('/Users/anaskhaiy/Desktop/PFE 4/Service Apprenant/src/pages/CompletedCoursesPage.tsx', 'r') as f:
    content = f.read()

target = """                        // A course with no lessons and no exam is NOT considered completed (progress = 0%)
                        const percentage = totalItems > 0
                            ? Math.round((completedItems / totalItems) * 100)
                            : 0;

                        if (totalItems > 0 && percentage >= 100) {"""

replacement = """                        // A course with no lessons and no exam is NOT considered completed (progress = 0%)
                        const percentage = totalItems > 0
                            ? Math.round((completedItems / totalItems) * 100)
                            : 0;

                        if (totalItems > 0 && percentage >= 100 && (course as any).contentCompleted === true) {"""

if target in content:
    with open('/Users/anaskhaiy/Desktop/PFE 4/Service Apprenant/src/pages/CompletedCoursesPage.tsx', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success")
else:
    print("Target not found")
