import json

with open('Nifty50_Financial_Forecasting.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

# The new bash script cell for train & evaluate
bash_code = """%%bash
mkdir -p ./results/graphs

for file in $(ls ./data/finance/*.csv | head -n 10); do
    stock_name=$(basename "$file" .csv)
    echo "============================================="
    echo "Training & Evaluating: $stock_name"
    echo "============================================="
    
    python run_LLM4TS.py \
      --is_training 1 \
      --is_llm 1 \
      --root_path ./data/finance/ \
      --data_path "${stock_name}.csv" \
      --model_id "Nifty50_${stock_name}_1min" \
      --model LLM4TS_pt \
      --data finance \
      --features S \
      --target Close \
      --seq_len 360 \
      --label_len 120 \
      --pred_len 360 \
      --patch_len 16 \
      --stride 8 \
      --train_epochs 5 \
      --batch_size 32 \
      --learning_rate 0.0001 \
      --freeze 0 \
      --llm gpt2 \
      --use_gpu 1 \
      --gpu 0 \
      --itr 1
      
    setting="Nifty50_${stock_name}_1min_sl360_pl360_llml1_lr0.0001_bs32_percent100_test_0"
    
    python evaluate_financial_model.py \
      --setting "$setting" \
      --data_path "$file" \
      --stock_name "$stock_name"
done
"""

for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code' and any('run_LLM4TS.py' in line for line in cell['source']):
        lines = [line + '\n' for line in bash_code.strip().split('\n')]
        lines[-1] = lines[-1].strip()
        nb['cells'][i]['source'] = lines
        
    elif cell['cell_type'] == 'code' and any('evaluate_financial_model.py' in line for line in cell['source']):
        nb['cells'][i]['source'] = ['# Evaluation is now handled in the main training loop cell above.']

with open('Nifty50_Financial_Forecasting.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=2)

print('Successfully patched Notebook.')
