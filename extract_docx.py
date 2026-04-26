"""
从 docx 文件提取内容并转换为 Markdown 格式
"""
from docx import Document
import os

def extract_docx_to_md(docx_path, md_path):
    """提取 docx 文件内容并保存为 Markdown"""
    doc = Document(docx_path)
    md_content = []
    
    for para in doc.paragraphs:
        if para.text.strip():
            # 根据样式判断标题级别
            style = para.style.name if para.style else ''
            text = para.text.strip()
            
            # 清理乱码字符（零宽字符、非断空格等）
            import re
            text = re.sub(r'[\u200b\u200c\u200d\ufeff\xa0]', '', text)
            
            if 'Heading 1' in style or '标题 1' in style:
                md_content.append(f"\n## {text}\n")
            elif 'Heading 2' in style or '标题 2' in style:
                md_content.append(f"\n### {text}\n")
            elif 'Heading 3' in style or '标题 3' in style:
                md_content.append(f"\n#### {text}\n")
            else:
                md_content.append(f"{text}\n")
    
    # 保存为 Markdown 文件
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_content))
    
    print(f"已提取: {docx_path} -> {md_path}")
    print(f"内容长度: {len(md_content)} 行")
    return len(md_content)

# 提取海大资料
base_dir = os.path.dirname(os.path.abspath(__file__))
docx_dir = os.path.join(base_dir, '海大资料')
kb_dir = os.path.join(base_dir, 'knowledge_base')

# 创建知识库目录
os.makedirs(kb_dir, exist_ok=True)

# 提取文件
files_to_extract = [
    ('海大简介（不含景观）.docx', 'introduction.md'),
    ('鱼山景观.docx', 'yushan.md'),
]

total_lines = 0
for docx_name, md_name in files_to_extract:
    docx_path = os.path.join(docx_dir, docx_name)
    md_path = os.path.join(kb_dir, md_name)
    
    if os.path.exists(docx_path):
        lines = extract_docx_to_md(docx_path, md_path)
        total_lines += lines
    else:
        print(f"警告: 文件不存在 {docx_path}")

print(f"\n提取完成! 总计 {total_lines} 行")
