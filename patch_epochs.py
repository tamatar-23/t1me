import json
import zipfile
import os

with open('Nifty50_Financial_Forecasting.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code':
        new_source = []
        for line in cell['source']:
            if '--train_epochs 5' in line:
                line = line.replace('--train_epochs 5', '--train_epochs 1')
            new_source.append(line)
        nb['cells'][i]['source'] = new_source

with open('Nifty50_Financial_Forecasting.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=2)

src = r'c:\Users\KIIT0001\Downloads\LLM4\aLLM4TS'
dst = r'c:\Users\KIIT0001\Downloads\LLM4\aLLM4TS_source.zip'

include_dirs = ['data_procurement', 'data_provider', 'exp', 'layers', 'models', 'utils']
include_files = ['run_LLM4TS.py', 'evaluate_financial_model.py', 'requirements.txt', 'Nifty50_Financial_Forecasting.ipynb']
exclude_dirs = ['__pycache__', '.ipynb_checkpoints']

with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as zf:
    for d in include_dirs:
        for root, dirs, files in os.walk(os.path.join(src, d)):
            dirs[:] = [x for x in dirs if x not in exclude_dirs]
            for f in files:
                full_path = os.path.join(root, f)
                arc_name = os.path.relpath(full_path, src).replace('\\\\', '/')
                zf.write(full_path, arc_name)
    for f in include_files:
        full_path = os.path.join(src, f)
        if os.path.exists(full_path):
            zf.write(full_path, f)

print(f'Successfully updated epochs and rebuilt Zip: {os.path.getsize(dst)/1024:.1f} KB')
