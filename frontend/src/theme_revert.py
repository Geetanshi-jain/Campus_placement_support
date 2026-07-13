import re
import os

css_path = r'C:\Users\jaing\OneDrive\Desktop\campus_placement_Support\frontend\src\index.css'

with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Remove the @import url at the top
css = re.sub(r"@import url\('https://fonts.googleapis.com/css2[^)]+'\);\n*", "", css)

# Revert root
old_root = """/* ── CSS Variables ─────────────────────────────────────────────── */
:root {
  /* Maroon palette */
  --maroon-900: #4a0000;
  --maroon-800: #6b0000;
  --maroon-700: #800000;
  --maroon-600: #9a1414;
  --maroon-500: #b52828;
  --maroon-400: #cc4444;
  --maroon-300: #d97070;
  --maroon-100: #fce8e8;
  --maroon-50:  #fff4f4;

  /* Beige palette */
  --beige-950: #2c2520;
  --beige-900: #3d3530;
  --beige-700: #6b5f52;
  --beige-500: #a89880;
  --beige-300: #d4c9b8;
  --beige-200: #e8e0d0;
  --beige-100: #f5f0e6;
  --beige-50:  #faf7f2;

  /* Gold accent */
  --gold:       #c9a227;
  --gold-light: #e8c547;

  /* Semantic */
  --primary:    var(--maroon-700);
  --primary-dark: var(--maroon-800);
  --bg:         var(--beige-50);
  --bg-card:    #ffffff;
  --text:       #1a1210;
  --text-muted: var(--beige-700);
  --border:     var(--beige-300);
  --success:    #1a7a4a;
  --warning:    #b57e00;
  --error:      #c0392b;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(128,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(128,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(128,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 60px rgba(128,0,0,0.22);

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  /* Transitions */
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}"""

css = re.sub(r':root\s*\{[^}]+\}', old_root, css, count=1)

# Revert font
css = css.replace("font-family: 'Outfit', 'Inter'", "font-family: 'Inter'")

# For the other modifications, it's easier to just remove the lines I added.
# Navbar added lines:
css = css.replace("  background: rgba(15, 23, 42, 0.65);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-bottom: 1px solid rgba(255,255,255,0.05);\n", "")
# Re-add original bg and border for navbar if needed (they were background: var(--bg-card); border-bottom: 1px solid var(--border);)
def fix_navbar(m):
    inner = m.group(2)
    if 'background' not in inner:
        inner += "  background: var(--bg-card);\n  border-bottom: 1px solid var(--border);\n"
    return m.group(1) + inner + m.group(3)
css = re.sub(r'(\.navbar\s*\{)([^}]+)(\})', fix_navbar, css)

# Dashcard added lines:
css = css.replace("  background: rgba(30, 41, 59, 0.4);\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(255,255,255,0.05);\n  transform: translateY(0);\n", "")
def fix_dashcard(m):
    inner = m.group(2)
    if 'background' not in inner:
        inner += "  background: var(--bg-card);\n"
    return m.group(1) + inner + m.group(3)
css = re.sub(r'(\.dash-card\s*\{)([^}]+)(\})', fix_dashcard, css)


# Dashcard hover added lines:
css = css.replace("  transform: translateY(-8px);\n  box-shadow: var(--shadow-lg);\n  border-color: rgba(99, 102, 241, 0.5);\n", "")

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Reverted successfully!")
