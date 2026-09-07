"""Static source audit; does not open a camera or install packages."""
import ast
import difflib
import re
import subprocess
from pathlib import Path
from html.parser import HTMLParser

root = Path(__file__).resolve().parents[1]
folder = root / "level1/files"
names = [f"01webcam_0{i}.py" for i in range(1, 6)] + [
    "02mediapipe_01.py", "02mediapipe_02.py", "03angle_01.py",
    "04count_01.py", "final.py", "korean_text.py", "test_install.py",
    "requirements.txt"
]
assert sorted(p.name for p in folder.iterdir()) == sorted(names)
for name in names:
    text = (folder / name).read_text(encoding="utf-8")
    assert not re.search(r"01[016789][- .]?\d{3,4}[- .]?\d{4}", text), "Phone pattern in " + name
    if name.endswith(".py"):
        tree = ast.parse(text, filename=name)
        compile(tree, name, "exec")
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "VideoCapture":
                assert isinstance(node.args[0], ast.Constant) and node.args[0].value == 0
                assert "기본 카메라. 안 잡히면 1로 변경" in text.splitlines()[node.lineno - 1]
    expected = (root / "ver1" / name).read_text(encoding="utf-8")
    expected = re.sub(r"^(\s*cap = cv2\.VideoCapture)\([01]\).*$",
                      r"\1(0)        # 기본 카메라. 안 잡히면 1로 변경", expected, flags=re.M)
    if name == "01webcam_05.py":
        expected = re.sub(r"import numpy as np[\s\S]*?(?=cap =)",
                          "from korean_text import put_korean_text\n\n", expected)
    if name in ["04count_01.py", "final.py"]:
        expected = expected.replace("judge_squart", "judge_squat").replace("GOOD SQUART", "GOOD SQUAT")
    if name == "final.py":
        expected = expected.replace("feedback, color = judge_squat(angle)",
                                    "feedback, color = judge_squat(angle)\n            status = feedback")
        expected = expected.replace("            put_korean_text(frame, feedback",
                                    "            frame = put_korean_text(frame, feedback")
    if name == "requirements.txt":
        expected = expected.rstrip("\n") + "\npillow==10.4.0               # 한글 출력 (PIL)\n"
    assert text.rstrip("\n") == expected.rstrip("\n"), "Unexpected source edit: " + name

class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.active = None
    def handle_starttag(self, tag, attrs):
        if tag == "pre":
            self.active = [dict(attrs), ""]
    def handle_data(self, data):
        if self.active is not None:
            self.active[1] += data
    def handle_endtag(self, tag):
        if tag == "pre":
            self.blocks.append(self.active)
            self.active = None

parser = Blocks()
parser.feed((root / "level1/index.html").read_text(encoding="utf-8"))
for attrs, content in parser.blocks:
    if "data-source" not in attrs:
        continue
    source = (root / "level1" / attrs["data-source"]).read_text(encoding="utf-8")
    if "data-source-lines" in attrs:
        start, end = map(int, attrs["data-source-lines"].split("-"))
        source = "\n".join(source.split("\n")[start - 1:end])
    assert content == source
    if "data-previous" in attrs:
        before = (root / "level1" / attrs["data-previous"]).read_text(encoding="utf-8").split("\n")
        after = source.split("\n")
        added = set()
        for kind, a, b, c, d in difflib.SequenceMatcher(None, before, after, autojunk=False).get_opcodes():
            if kind in ("insert", "replace"):
                added.update(range(c + 1, d + 1))
        highlighted = set(map(int, attrs["data-highlight"].split(",")))
        assert highlighted == added, (attrs["data-source"], highlighted ^ added)
        print("PASS highlighted diff", attrs["data-source"], sorted(added))

# Execute the pure judge function at each boundary, without importing webcam modules.
for name in ["04count_01.py", "final.py"]:
    tree = ast.parse((folder / name).read_text(encoding="utf-8"))
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "judge_squat")
    namespace = {}
    exec(compile(ast.Module(body=[fn], type_ignores=[]), name, "exec"), namespace)
    for angle, label in [(170, "STAND UP"), (160, "MORE DEEP"), (100, "GOOD SQUAT"), (70, "TOO DEEP")]:
        assert namespace["judge_squat"](angle)[0] == label

for item in ["ver1/", "ver2/", "source/", "ver2/venv/", "__pycache__/check.pyc", "ver1.zip", "ver2.zip"]:
    subprocess.run(["git", "check-ignore", "-q", item], cwd=root, check=True)
assert not subprocess.check_output(["git", "ls-files", "ver1", "ver2", "source"], cwd=root)
assert subprocess.run(["git", "check-ignore", "-q", "level1/files/requirements.txt"], cwd=root).returncode == 1
print("PASS 12 Python files + requirements, syntax, camera defaults, A1-A5, exact source, ignore rules")

for file in sorted((root / "ver2").glob("practice*.py")):
    text = file.read_text(encoding="utf-8")
    methods = [n.func.attr for n in ast.walk(ast.parse(text))
               if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
               and n.func.attr in ("arctan2", "arccos")]
    print(file.name, sorted(set(methods)) or "position/distance; no angle function")
