import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Mock fyers_apiv3 boilerplate
class FyersMockAPI:
    def __init__(self, client_id, access_token):
        self.client_id = client_id
        self.access_token = access_token
        
    def get_history(self, symbol, resolution, date_from, date_to):
        """
        Mock history fetcher.
        Generates synthetic 1-minute OHLCV financial data with high volatility.
        """
        print(f"Fetching {symbol} from {date_from} to {date_to} at {resolution} resolution...")
        
        # Generate timestamps for 1-minute intervals (mocking a few days)
        start_dt = datetime.strptime(date_from, "%Y-%m-%d")
        end_dt = datetime.strptime(date_to, "%Y-%m-%d")
        total_minutes = int((end_dt - start_dt).total_seconds() / 60)
        
        timestamps = [start_dt + timedelta(minutes=i) for i in range(total_minutes)]
        
        # Random walk generation for prices
        np.random.seed(hash(symbol) % 10000) # Deterministic based on symbol
        returns = np.random.normal(loc=0.0, scale=0.005, size=total_minutes)
        price_series = np.cumprod(1 + returns) * (10000 + np.random.randint(100, 5000))
        
        # O, H, L, C mocking based on the close price series
        closes = price_series
        opens = closes * (1 + np.random.normal(0, 0.001, total_minutes))
        highs = np.maximum(opens, closes) * (1 + np.abs(np.random.normal(0, 0.002, total_minutes)))
        lows = np.minimum(opens, closes) * (1 - np.abs(np.random.normal(0, 0.002, total_minutes)))
        volumes = np.random.randint(1000, 1000000, size=total_minutes)
        
        df = pd.DataFrame({
            'date': [t.strftime("%Y-%m-%d %H:%M:%S") for t in timestamps],
            'Open': opens,
            'High': highs,
            'Low': lows,
            'Close': closes,
            'Volume': volumes
        })
        return df

def fetch_and_save_nifty50_data():
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'finance')
    os.makedirs(output_dir, exist_ok=True)
    
    # Complete Nifty50 tickers list
    tickers = [
        "NSE:RELIANCE-EQ", "NSE:TCS-EQ", "NSE:HDFCBANK-EQ", "NSE:ICICIBANK-EQ", "NSE:BHARTIARTL-EQ",
        "NSE:SBIN-EQ", "NSE:INFY-EQ", "NSE:LT-EQ", "NSE:ITC-EQ", "NSE:BAJFINANCE-EQ",
        "NSE:AXISBANK-EQ", "NSE:HINDUNILVR-EQ", "NSE:KOTAKBANK-EQ", "NSE:M&M-EQ", "NSE:TATASTEEL-EQ",
        "NSE:NTPC-EQ", "NSE:ASIANPAINT-EQ", "NSE:TATAMOTORS-EQ", "NSE:MARUTI-EQ", "NSE:SUNPHARMA-EQ",
        "NSE:TITAN-EQ", "NSE:ULTRACEMCO-EQ", "NSE:BAJAJFINSV-EQ", "NSE:HCLTECH-EQ", "NSE:POWERGRID-EQ",
        "NSE:INDUSINDBK-EQ", "NSE:NESTLEIND-EQ", "NSE:ADANIENT-EQ", "NSE:ADANIPORTS-EQ", "NSE:GRASIM-EQ",
        "NSE:WIPRO-EQ", "NSE:JSWSTEEL-EQ", "NSE:TECHM-EQ", "NSE:HINDALCO-EQ", "NSE:SBILIFE-EQ",
        "NSE:DRREDDY-EQ", "NSE:CIPLA-EQ", "NSE:LTIM-EQ", "NSE:ONGC-EQ", "NSE:BRITANNIA-EQ",
        "NSE:EICHERMOT-EQ", "NSE:TATACONSUM-EQ", "NSE:APOLLOHOSP-EQ", "NSE:BAJAJ-AUTO-EQ", "NSE:DIVISLAB-EQ",
        "NSE:UPL-EQ", "NSE:HEROMOTOCO-EQ", "NSE:HDFCLIFE-EQ", "NSE:BPCL-EQ", "NSE:COALINDIA-EQ"
    ][:10]
    
    api = FyersMockAPI(client_id="DUMMY_CLIENT", access_token="DUMMY_TOKEN")
    
    date_to = datetime.now()
    date_from = date_to - timedelta(days=30)
    
    date_to_str = date_to.strftime("%Y-%m-%d")
    date_from_str = date_from.strftime("%Y-%m-%d")
    
    for ticker in tickers:
        df = api.get_history(ticker, resolution="1", date_from=date_from_str, date_to=date_to_str)
        save_path = os.path.join(output_dir, f"{ticker.split(':')[1].split('-')[0]}.csv")
        df.to_csv(save_path, index=False)
        print(f"Saved data for {ticker} to {save_path}")

if __name__ == "__main__":
    fetch_and_save_nifty50_data()
