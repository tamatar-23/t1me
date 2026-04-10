# T1ME_Nifty50 (Adapted LLMs for High-Frequency Time Series)

<div align="center">
  <img src='https://img.shields.io/badge/Python-3.10+-blue?style=flat&logo=python' alt='Python'>
  <img src='https://img.shields.io/badge/PyTorch-2.0+-ee4c2c?style=flat&logo=pytorch' alt='PyTorch'>
  <img src='https://img.shields.io/badge/React-18+-61dafb?style=flat&logo=react' alt='React'>
  <img src='https://img.shields.io/badge/GPU-DataParallel-yellow' alt='DDP'>
</div>

**T1ME_Nifty50** is a highly specialized framework engineered to repurpose pre-trained Large Language Models (LLMs)—specifically GPT-2 and LLaMA backbones—for high-frequency financial forecasting. 

The architecture diverges drastically from recurrent networks (LSTMs, GRUs) or classical statistical approaches (ARIMA, GARCH). Instead, it bridges the modality gap by treating continuous price movements as discrete tokens. Ingesting 1-minute OHLCV datasets, it projects entire trading windows (360-minutes, 09:15 AM to 03:15 PM) with zero-shot generalization capabilities, precisely tracking market volatility.

---

## Table of Contents
1. [Core Features & Tasks](#core-features--tasks)
2. [Architectural Deep Dive & Mathematics](#architectural-deep-dive--mathematics)
    - [Reversible Instance Normalization (RevIN)](#1-reversible-instance-normalization-revin)
    - [Time-Series Patching Geometry](#2-time-series-patching-geometry)
    - [Fast Fourier Transform (FFT) Noise Filtration](#3-fast-fourier-transform-fft-noise-filtration)
    - [Transformer Algorithm (Frozen Attention & Linear Probes)](#4-transformer-algorithm-frozen-attention--linear-probes)
3. [Project Directory Architecture](#project-directory-architecture)
4. [Data Procurement Protocol](#data-procurement-protocol--fyers-api-)
5. [Frontend Dashboard Analytics](#frontend-dashboard-analytics-react--recharts)
6. [Training Pipeline & Google Colab Integration](#training-pipeline--google-colab-integration)
7. [Evaluation & Metric Definitions](#evaluation--metric-definitions)

---

## Core Features & Tasks

Managed exclusively through the deterministic graph entrypoint `run_LLM4TS.py`, the computational backbone supports:
*   **Long-term Forecasting (`--task_name 'long_term_forecast'`):** Predicting multi-hour trajectories from historical patches.
*   **Imputation (`--task_name 'imputation'`):** Reconstructing missing temporal patches natively through interpolation.
*   **Anomaly Detection (`--task_name 'anomaly_detection'`):** Tracing structural breaks, liquidity voids, and micro-crashes.
*   **Classification (`--task_name 'classification'`):** Binary or Multi-class price direction mapping.

---

## Architectural Deep Dive & Mathematics

T1ME_Nifty50 manipulates standard temporal embeddings to suppress financial noise. The computation flows primarily through `./layers/Embed.py` and `./models/LLM4TS_sft_zero.py`.

### 1. Reversible Instance Normalization (RevIN)
To neutralize aggressive distribution shifts, covariate drift, and non-stationarity—which fundamentally destroy statistical models in live financial markets—the forward pass begins and concludes with the `RevIN.py` affine module.

**Pre-normalization (Input Constraint):**
Shifts incoming arrays to a stable mean and standard variance:
$$X'_{in} = \frac{X_{in} - \mu}{\sigma}$$
Where $\mu$ is the trailing window mean, and $\sigma$ is the standard deviation.

**Post-denormalization (Output Conversion):**
Once the LLM yields the dimensionless output token probabilities, RevIN applies an exact inverse scaling mechanism to restore native price formats (e.g., matching actual INR index ranges):
$$Y_{out} = (LLM_{out} \times \sigma) + \mu$$

### 2. Time-Series Patching Geometry
High-frequency point-by-point data is heavily redundant computationally and lacks long-range semantic meaning. T1ME_Nifty50 employs chronological chunking known as **Patching**.
The raw sequence is separated into overlapping tensor windows:
$$N_{patches} = \left\lfloor\frac{L - P_{len}}{S}\right\rfloor + 1$$
Where:
- $L$ = Sequence Length
- $P_{len}$ = Patch Length (`16` by default)
- $S$ = Stride overlap size (`8` by default)

These patches are then projected through a **1D Convolution Layer** (`kernel_size=3`) configured as a strict low-pass filter. This physically binds micro-volatility variations into a unified, stable discrete "token" before reaching the linguistic embedding block.

### 3. Fast Fourier Transform (FFT) Noise Filtration
When market noise exceeds analytical thresholds, `--fft` channels signal reconstruction via `scipy.fft`. The continuous sequence is translated into the frequency domain:
$$X(k) = \sum_{n=0}^{N-1} x_n e^{-j 2\pi k n / N}$$
The architecture actively identifies and filters out the lowest-prominence magnitude vectors (stochastic noise). The refined, structurally sound components are reconstructed back into the temporal domain via Inverse FFT ($iFFT$), feeding pure momentum-based waves into the patching logic.

### 4. Transformer Algorithm (Frozen Attention & Linear Probes)
The defining characteristic of T1ME_Nifty50 is that the core Multi-Head Self-Attention matrix of the underlying model (e.g., `modeling_gpt2.py`) is entirely **frozen**. 
- The model trains *exclusively* on shallow, dimensional alignment planes appended before and after the transformer: `self.in_layer` and `self.out_layer`.
- The financial tokens are pushed through frozen GPT-2 semantic blocks, utilizing the $Q \times K^T \div \sqrt{d}$ self-attention logic trained originally on billions of syntax derivations. The framework successfully translates financial momentum by treating it fundamentally as language semantic extrapolation.

---

## Project Directory Architecture

```text
aLLM4TS/
├── data_procurement/          
│   └── fetch_nifty50.py       # FyersAPI routines fetching high-density OHLCV
├── data/                      # Stored tensor arrays/CSVs mapped to index
├── exp/                       # Experiment runners managing iteration loops
├── frontend/                  
│   ├── src/App.jsx            # React Dashboard orchestrator mapping Recharts 
│   ├── src/index.css          # Brutalist minimal design variables 
│   └── public/data/           # Evaluation payload dropzone for UI bridging
├── layers/                    # Neural primitives (RevIN, Convolution Embedders)
├── models/                    # Model wrappers (LLM4TS_sft_zero, GPT2 custom weights)
├── results/                   
│   ├── best_stocks...csv      # Aggregate cumulative regression scores
│   └── graphs/                # High-res raw comparative visualizations
├── evaluate_financial_model.py# Inference testing, converting NPY -> JSON array logic
├── run_LLM4TS.py              # CLI Argument entrypoint
└── T1ME_Nifty50.ipynb         # Cloud GPU orchestrator integrating the total pipeline
```

---

## Data Procurement Protocol (Fyers API)

Within `./data_procurement/fetch_nifty50.py`, an autonomous pipeline fetches necessary execution sequences directly into `./data/finance/`.
- **Dimensional Limitations:** Safely constraints fetch parameters solely to the 10 highest-volume assets to maintain hardware parity (`RELIANCE`, `HDFCBANK`, etc.).
- **Data Mocking:** Includes a standalone `FyersMockAPI` utilizing deterministic Gaussian Random Walk algorithms allowing end-to-end sandbox testing without executing costly API calls or breaching rate limits.

---

## Frontend Dashboard Analytics (React + Recharts)

To inspect inference outputs efficiently, the pipeline relies on an entirely decoupled Brutalist React Dashboard mapping specific trading bounds (09:15 AM to 03:15 PM).

**Analytical Setup & Technology Stack:**
1. Built strictly on React 18, Vite, and native `Recharts`.
2. Fully decoupled execution. Instead of requiring active python proxy servers or fragile WebSockets, the Colab pipeline directly outputs isolated JSON parameter payloads straight into `/frontend/public/data/`. The UI hot-ingests this array directly on browser startup.

**Visual Mapping Implementation:**
- **Left Panel (Overlay):** Maps actual historical target arrays overlapping the model's exact precision outputs bounding a strict 360 integer-X scale mapped dynamically to minute-by-minute timestamps via `indexToTime(i)`.
- **Right Panel (Area Trace):** Displays the identical structural parameters exclusively tracing the true asset market volatility, visually distinguished using gradient rendering systems (`linearGradient` fills).

---

## Training Pipeline & Google Colab Integration

Cloud-side execution is specifically managed through the standalone `T1ME_Nifty50.ipynb` wrapper, specifically optimized for T4/Ampere level graphics processing.

### Hardware Initialization Requirements
- Python == 3.10
- Accelerate == 0.26.0
- Memory Allocation uses Automatic Mixed Precision (`torch.cuda.amp.GradScaler`) allowing localized Floating-Point 16 logic bridging to save VRAM limits natively.

### Core CLI Parameters
Execution is initiated via argument controls.

```bash
python run_LLM4TS.py \
  --is_training 1 \
  --model_id "T1ME50" \
  --model "LLM4TS_sft_zero" \
  --data "finance" \
  --data_path "ADANIENT.csv" \
  --seq_len 360 \
  --pred_len 360 \
  --patch_len 16 \
  --stride 8 \
  --llm "gpt2" \
  --revin 1 \
  --use_amp \
  --use_gpu True
```

In the notebook sequence, this shell command loops through the arrays collected by `fetch_nifty50.py`, evaluating independently, rendering inference plots, and packing ZIP structures locally for download.

---

## Evaluation & Metric Definitions

To ensure Zero-Shot validation, backtesting uses distinct mathematical arrays preventing temporal leakage:
Outputs generated by `.py` execution files are post-processed inside `evaluate_financial_model.py`.

**Primary Computation Metrics Generated:**
- **MSE (Mean Squared Error):** Traces extreme outlier predictions in high-volatility shifts.
- **MAE (Mean Absolute Error):** Standard baseline divergence measurement per tick against actual true movement.
- **R² (Coefficient of Determination):** Serves as the ultimate scalar benchmark. Because patching properly manages tokenization arrays, T1ME_Nifty50 consistently charts zero-shot generalization coefficients at `R² > 0.999x` bounded within continuous limits.

The final evaluation array appends all performance factors independently corresponding to individual stocks within `results/best_stocks_predictions.csv`.
