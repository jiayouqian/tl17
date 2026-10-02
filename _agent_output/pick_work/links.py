import re, os
WD = "/home/user/Doubao/chats/38444600724347906/tl17-repo/_agent_output/pick_work"
html = open(os.path.join(WD,'nuhuo20.html'), encoding='utf-8').read()
print("=== all href ===")
for h in sorted(set(re.findall(r'href="([^"]+)"', html))):
    print(" ", h)
print("=== all src ===")
for s in sorted(set(re.findall(r'src="([^"]+)"', html))):
    print(" ", s)
print("=== all /d/ or /api/ paths mentioned ===")
for p in sorted(set(re.findall(r'["\'](/[a-zA-Z0-9_/\-]+)["\']', html))):
    print(" ", p)
