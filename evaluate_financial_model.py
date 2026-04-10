import os
import argparse
import json
import csv
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from utils.metrics import metric

def evaluate_and_plot(setting, data_path, stock_name, seq_len=360, pred_len=360):
    result_dir = os.path.join('./results', setting)
    pred_path = os.path.join(result_dir, 'pred.npy')
    true_path = os.path.join(result_dir, 'true.npy')

    if not os.path.exists(pred_path) or not os.path.exists(true_path):
        print(f"Error: Could not find pred.npy or true.npy in {result_dir}")
        return

    # Load tensors: shape (samples, pred_len, channels)
    preds = np.load(pred_path)
    trues = np.load(true_path)
    
    # We will pick the first sequence to visualize
    # If multivariable, target is usually the last channel (-1)
    pred_seq = preds[0, :, -1]
    true_seq = trues[0, :, -1]

    # Re-instantiate Scaler to inverse-transform
    # We fit it on the 70% train data of the specific CSV
    df = pd.read_csv(data_path)
    target_col = 'Close'
    if target_col not in df.columns:
        target_col = df.columns[-1]

    num_train = int(len(df) * 0.7)
    train_data = df[[target_col]].iloc[:num_train].values

    scaler = MinMaxScaler()
    scaler.fit(train_data)

    # Inverse transform
    pred_seq_inv = scaler.inverse_transform(pred_seq.reshape(-1, 1)).flatten()
    true_seq_inv = scaler.inverse_transform(true_seq.reshape(-1, 1)).flatten()

    # Calculate metrics on the inverse-transformed data
    mae, mse, rmse, mape, mspe, rse, r2 = metric(pred_seq_inv, true_seq_inv)
    
    print(f"Metrics (INR):")
    print(f"MSE: {mse:.2f} | MAE: {mae:.2f} | R-squared: {r2:.4f}")

    # Plot
    plt.figure(figsize=(12, 6))
    plt.plot(true_seq_inv, label='Actual Price (INR)', color='blue', linewidth=2)
    plt.plot(pred_seq_inv, label='Predicted Price (INR)', color='red', linestyle='--', linewidth=2)
    
    title = f"{stock_name} 1-Min Forecast | Pred Window: {pred_len}\nMSE: {mse:.2f} | MAE: {mae:.2f} | R^2: {r2:.4f}"
    plt.title(title, fontsize=14, fontweight='bold')
    plt.xlabel('Time Steps (Minutes)', fontsize=12)
    plt.ylabel('Price (INR)', fontsize=12)
    plt.legend(fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    graphs_dir = os.path.join('./results', 'graphs')
    os.makedirs(graphs_dir, exist_ok=True)
    save_path = os.path.join(graphs_dir, f'{stock_name}_actual_vs_predicted.png')
    plt.savefig(save_path, dpi=300)
    print(f"Graph saved to {save_path}")

    # Export to JSON for frontend
    frontend_data_dir = os.path.join('./frontend', 'public', 'data')
    os.makedirs(frontend_data_dir, exist_ok=True)
    json_path = os.path.join(frontend_data_dir, f'{stock_name}.json')
    data_payload = {
        'stock_name': stock_name,
        'mse': float(mse),
        'mae': float(mae),
        'r2': float(r2),
        'actual': true_seq_inv.tolist(),
        'predicted': pred_seq_inv.tolist()
    }
    with open(json_path, 'w') as f:
        json.dump(data_payload, f)
    print(f"JSON data saved to {json_path}")
    
    # Export / Append to best_stocks_predictions.csv
    csv_path = os.path.join('./results', 'best_stocks_predictions.csv')
    file_exists = os.path.isfile(csv_path)
    with open(csv_path, 'a', newline='') as csvfile:
        fieldnames = ['stock_name', 'mse', 'mae', 'r2', 'latest_pred_value']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'stock_name': stock_name,
            'mse': float(mse),
            'mae': float(mae),
            'r2': float(r2),
            'latest_pred_value': float(pred_seq_inv[-1])
        })
    print(f"Metrics appended to {csv_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--setting', type=str, required=True, help='Model setting directory name in results/')
    parser.add_argument('--data_path', type=str, required=True, help='Path to the original CSV file used for training')
    parser.add_argument('--stock_name', type=str, required=True, help='Name of the stock being evaluated')
    args = parser.parse_args()
    
    evaluate_and_plot(args.setting, args.data_path, args.stock_name)
