import json, os, re
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import anthropic

from routers.auth import get_current_user

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'linear-algebra')

with open(os.path.join(DATA_DIR, 'exams.json')) as f:
    EXAMS = json.load(f)


# ── Post-processing: fix bare LaTeX ─────────────────────────────

# LaTeX commands that MUST be inside $...$ to render
_LATEX_SIMPLE_CMDS = r'(\\lambda|\\alpha|\\beta|\\gamma|\\delta|\\epsilon|\\theta|\\mu|\\sigma|\\omega|\\varphi|\\rho|\\eta|\\tau|\\pi|\\xi|\\psi|\\cdot|\\times|\\leq|\\geq|\\neq|\\approx|\\equiv|\\sim|\\infty|\\sum|\\prod|\\int|\\partial|\\forall|\\exists|\\in|\\notin|\\subset|\\subseteq|\\cup|\\cap|\\Rightarrow|\\rightarrow|\\leftarrow|\\longrightarrow|\\text|\\quad|\\qquad|\\mathbb|\\mathbf|\\mathcal|\\mathrm|\\cdots|\\vdots|\\ddots|\\pm|\\mp|\\angle|\\triangle|\\square|\\perp|\\parallel|\\|\,|\\!)'

_LATEX_COMPLEX_CMDS = r'(\\frac\s*\{[^}]*\}\s*\{[^}]*\}|\\sqrt\s*\{[^}]*\}|\\overline\s*\{[^}]*\}|\\underline\s*\{[^}]*\}|\\hat\s*\{[^}]*\}|\\bar\s*\{[^}]*\}|\\vec\s*\{[^}]*\}|\\dot\s*\{[^}]*\}|\\tilde\s*\{[^}]*\})'

_LATEX_ENV = r'(\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\})'

# Characters that indicate we're inside a math block
_MATH_START = re.escape('$')


def fix_latex_wrapping(text: str) -> str:
    """Auto-wrap bare LaTeX commands that are outside $...$ math delimiters."""
    # Step 1: Protect existing math blocks and code blocks
    protected = []
    # Protect $$...$$
    text = re.sub(r'\$\$([\s\S]*?)\$\$', lambda m: _protect(m.group(0), protected), text)
    # Protect $...$
    text = re.sub(r'(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)', lambda m: _protect(m.group(0), protected), text)
    # Protect code blocks
    text = re.sub(r'```[\s\S]*?```', lambda m: _protect(m.group(0), protected), text)
    # Protect inline code
    text = re.sub(r'`[^`]+`', lambda m: _protect(m.group(0), protected), text)

    # Step 2: Wrap \begin{...}...\end{...} environments in $$
    def wrap_env(m):
        content = m.group(0)
        # Skip if it's already protected
        if content.startswith('__PROTECTED_'):
            return content
        return f'$${content}$$'

    text = re.sub(_LATEX_ENV, wrap_env, text)

    # Step 3: Wrap complex LaTeX commands (\frac, \sqrt, etc.) in $
    def wrap_complex(m):
        content = m.group(0)
        if content.startswith('__PROTECTED_'):
            return content
        return f'${content}$'

    text = re.sub(_LATEX_COMPLEX_CMDS, wrap_complex, text)

    # Step 4: Wrap simple LaTeX commands (\lambda, \alpha, etc.) in $
    def wrap_simple(m):
        content = m.group(0)
        if content.startswith('__PROTECTED_'):
            return content
        # Don't wrap if already adjacent to $
        return f'${content}$'

    text = re.sub(_LATEX_SIMPLE_CMDS, wrap_simple, text)

    # Step 5: Restore protected blocks
    for i, block in enumerate(protected):
        text = text.replace(f'__PROTECTED_{i}__', block)

    return text


def _protect(text: str, protected: list) -> str:
    protected.append(text)
    return f'__PROTECTED_{len(protected) - 1}__'


def get_client():
    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("DEEPSEEK_API_KEY", "")
    return anthropic.Anthropic(api_key=api_key, base_url="https://api.deepseek.com/anthropic")


# ── Exam Data ───────────────────────────────────────────────────

@router.get("/exams")
def list_exams(user: dict = Depends(get_current_user)):
    return [{"year": e["year"], "section_count": e["section_count"], "char_count": len(e["full_text"])} for e in EXAMS]


@router.get("/exams/{year}")
def get_exam(year: str, user: dict = Depends(get_current_user)):
    for e in EXAMS:
        if e["year"] == year:
            return e
    return {"error": "Year not found"}


# ── AI: Knowledge Points ────────────────────────────────────────

class QuestionRequest(BaseModel):
    year: str
    section_index: int
    question_text: str


@router.post("/knowledge-points")
def extract_knowledge_points(req: QuestionRequest, user: dict = Depends(get_current_user)):
    client = get_client()
    response = client.messages.create(
        model="deepseek-chat",
        max_tokens=1024,
        temperature=0.3,
        system="你是中南大学线性代数辅导专家。分析题目考察的知识点，用中文简洁回答。",
        messages=[{
            "role": "user",
            "content": f"""请分析以下线性代数题考察的知识点。按以下格式输出：

**知识点：**（简要概括核心知识点，如"行列式计算 - 范德蒙行列式"）
**涉及概念：**（列出题目涉及的关键概念，用顿号分隔）
**解题方法：**（一句话概括解题思路）
**难度：**（容易/中等/困难）

题目：
{req.question_text[:2000]}"""
        }]
    )
    return {"analysis": fix_latex_wrapping(response.content[0].text)}


# ── AI: Generate Similar Questions ──────────────────────────────

class GenerateRequest(BaseModel):
    knowledge_point: str
    count: int = 3


@router.post("/generate-questions")
def generate_questions(req: GenerateRequest, user: dict = Depends(get_current_user)):
    client = get_client()
    response = client.messages.create(
        model="deepseek-chat",
        max_tokens=2048,
        temperature=0.7,
        system="你是中南大学线性代数出题老师。根据知识点生成相似考题。",
        messages=[{
            "role": "user",
            "content": f"""根据以下知识点，生成{req.count}道线性代数题目。题目要有代表性，难度递进。

知识点：{req.knowledge_point}

要求：
1. 题目格式模仿中南大学期末考试风格
2. 每题后附答案和简要解析
3. 按难度从易到难排列
4. 用 Markdown 格式输出"""
        }]
    )
    return {"questions": fix_latex_wrapping(response.content[0].text)}


# ── AI: Compose Paper ──────────────────────────────────────────

class ComposeRequest(BaseModel):
    years: list[str] = []
    ai_count: int = 3
    difficulty: str = "medium"  # easy / medium / hard


@router.post("/compose-paper")
def compose_paper(req: ComposeRequest, user: dict = Depends(get_current_user)):
    client = get_client()

    # Collect past questions from selected years
    past_questions = []
    for e in EXAMS:
        if not req.years or e["year"] in req.years:
            for sec in e["sections"]:
                past_questions.append(f"【{e['year']}】{sec['title']}\n{sec['content'][:500]}")

    past_text = "\n\n---\n\n".join(past_questions[:5]) if past_questions else "无"

    response = client.messages.create(
        model="deepseek-chat",
        max_tokens=4096,
        temperature=0.5,
        system="你是中南大学线性代数出题组组长。根据历年真题风格，组一套完整的期末试卷。所有数学公式使用 KaTeX 兼容的 LaTeX 语法：行内公式用 $...$，行间公式用 $$...$$，矩阵用 bmatrix 环境。",
        messages=[{
            "role": "user",
            "content": f"""请根据以下中南大学线性代数历年真题的风格，组一套完整的模拟期末试卷。

参考真题片段：
{past_text}

要求：
1. 试卷结构：一、填空题（5题，每题3分）、二、选择题（5题，每题3分）、三、计算题（3题，每题10分）、四、证明题（2题，每题10分）
2. 额外生成{req.ai_count}道AI原创题，穿插在试卷中
3. 难度：{req.difficulty}
4. **试卷必须严格分成两部分输出，中间用独占一行的 === 分隔：**
   - 第一部分：试题部分（只有题目，不含答案）
   - 第二部分：答案与解析（题号对应，含详细步骤）
5. 数学公式使用标准 LaTeX：行内公式用 $...$，行间公式用 $$...$$，矩阵用 \\begin{{bmatrix}}...\\end{{bmatrix}}
6. 填空题的空白处在公式外使用（ ），不要用下划线
7. 用 Markdown 格式输出
8. 第一部分标题用 # 试题部分，第二部分标题用 # 答案与解析"""
        }]
    )
    return {"paper": fix_latex_wrapping(response.content[0].text)}
