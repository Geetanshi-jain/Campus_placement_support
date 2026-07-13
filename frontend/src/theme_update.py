import re
import os

css_path = r'C:\Users\jaing\OneDrive\Desktop\campus_placement_Support\frontend\src\index.css'

with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Replace root variables entirely
root_pattern = r':root\s*\{[^}]+\}'
new_root = """@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');

:root {
  /* Slate & Navy palette (Dark Mode Base) */
  --beige-950: #020617;
  --beige-900: #0f172a;
  --beige-700: #1e293b;
  --beige-500: #334155;
  --beige-300: #475569;
  --beige-200: #64748b;
  --beige-100: #94a3b8;
  --beige-50:  #f8fafc;

  /* Neon Purple / Indigo palette (Accent) */
  --maroon-900: #312e81;
  --maroon-800: #3730a3;
  --maroon-700: #4f46e5;
  --maroon-600: #6366f1;
  --maroon-500: #818cf8;
  --maroon-400: #a5b4fc;
  --maroon-300: #c7d2fe;
  --maroon-100: #e0e7ff;
  --maroon-50:  rgba(79, 70, 229, 0.1);

  /* Gold accent -> Neon Cyan */
  --gold:       #06b6d4;
  --gold-light: #22d3ee;

  /* Semantic */
  --primary:    var(--maroon-600);
  --primary-dark: var(--maroon-700);
  --bg:         var(--beige-950);
  --bg-card:    rgba(15, 23, 42, 0.6);
  --text:       var(--beige-50);
  --text-muted: var(--beige-100);
  --border:     rgba(255, 255, 255, 0.1);
  --success:    #10b981;
  --warning:    #f59e0b;
  --error:      #ef4444;

  /* Shadows */
  --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 0 20px rgba(99, 102, 241, 0.3);
  --shadow-xl: 0 0 40px rgba(99, 102, 241, 0.4);

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  /* Transitions */
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}"""
css = re.sub(root_pattern, new_root, css, count=1)

# Apply global font change
css = css.replace("font-family: 'Inter'", "font-family: 'Outfit', 'Inter'")

# Inject Glassmorphism for Navbar
navbar_pattern = r'(\.navbar\s*\{)([^}]+)(\})'
def navbar_repl(m):
    inner = m.group(2)
    # remove old bg and border
    inner = re.sub(r'background:\s*[^;]+;', '', inner)
    inner = re.sub(r'border-bottom:\s*[^;]+;', '', inner)
    inner += "  background: rgba(15, 23, 42, 0.65);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-bottom: 1px solid rgba(255,255,255,0.05);\n"
    return m.group(1) + inner + m.group(3)
css = re.sub(navbar_pattern, navbar_repl, css)

# Inject Glassmorphism for Cards
dashcard_pattern = r'(\.dash-card\s*\{)([^}]+)(\})'
def dashcard_repl(m):
    inner = m.group(2)
    inner = re.sub(r'background:\s*[^;]+;', '', inner)
    inner += "  background: rgba(30, 41, 59, 0.4);\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(255,255,255,0.05);\n  transform: translateY(0);\n"
    return m.group(1) + inner + m.group(3)
css = re.sub(dashcard_pattern, dashcard_repl, css)

# Dashcard hover animation
dashcard_hover = r'(\.dash-card:hover\s*\{)([^}]+)(\})'
def hover_repl(m):
    inner = m.group(2)
    inner += "  transform: translateY(-8px);\n  box-shadow: var(--shadow-lg);\n  border-color: rgba(99, 102, 241, 0.5);\n"
    return m.group(1) + inner + m.group(3)
css = re.sub(dashcard_hover, hover_repl, css)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Theme updated successfully!")
