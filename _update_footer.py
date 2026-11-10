from pathlib import Path
import re

root = Path(r"C:\Users\Dev Account\Downloads\nexa\nexa")
pattern = re.compile(
    r'<li><a href="#" aria-label="Facebook"><i class="ti-facebook"></i></a></li>\s*'
    r'<li><a href="#" aria-label="X">.*?</li>\s*'
    r'<li><a href="#" aria-label="LinkedIn"><i class="ti-linkedin"></i></a></li>\s*'
    r'<li><a href="#" aria-label="Pinterest"><i class="ti-pinterest"></i></a></li>\s*'
    r'<li><a href="#" aria-label="Vimeo"><i class="ti-vimeo-alt"></i></a></li>',
    re.S,
)
replacement = """<li><a href="https://www.linkedin.com/company/nexastruct" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="ti-linkedin"></i></a></li>
                                        <li><a href="https://www.instagram.com/nexastruct/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="ti-instagram"></i></a></li>
                                        <li><a href="https://www.facebook.com/nexastruct" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="ti-facebook"></i></a></li>"""

count = 0
for p in root.rglob("*.html"):
    if "bark" in p.parts:
        continue
    text = p.read_text(encoding="utf-8")
    idx = text.find("<footer")
    if idx < 0:
        print("NO FOOTER", p.name)
        continue
    head, tail = text[:idx], text[idx:]
    new_tail, n = pattern.subn(replacement, tail, count=1)
    if n != 1:
        print("PATTERN MISSING", p)
        continue
    p.write_text(head + new_tail, encoding="utf-8")
    count += 1
    print("updated", p.relative_to(root))
print("total", count)
