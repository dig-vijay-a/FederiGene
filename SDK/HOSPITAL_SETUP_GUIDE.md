# FederiGene: Hospital Setup Guide

Welcome to the FederiGene ecosystem. This guide is designed for Hospital IT administrators and Data Custodians. By following these steps, you will configure a **Local Training Node** that allows your hospital's genomic data to participate in advanced Federated Learning *without the raw data ever leaving your secure network*.

## 1. Prerequisites

Before installing the FederiGene software, ensure your host machine (the server or desktop that has access to your genomic datasets) meets the following requirements:
- **Operating System:** Windows 10/11, macOS 12+, or Ubuntu 22.04+
- **Python:** Python 3.9, 3.10, or 3.11 must be installed.
- **Hardware:** At least 16GB RAM. A dedicated GPU (NVIDIA) is highly recommended for faster PyTorch training but not strictly required.

## 2. Environment Setup

Our desktop application uses a local Python environment to execute secure PyTorch training loops. You need to prepare this environment:

1. Open your terminal or command prompt.
2. Install the required PyTorch and networking libraries globally or in a virtual environment:
   ```bash
   pip install torch torchvision requests
   ```

## 3. Install the FederiGene Desktop App

Instead of using a command-line script, FederiGene provides a secure, native desktop application built with Tauri. 
1. Download the latest installer for your operating system from the central FederiGene portal.
2. Run the installer and launch the **FederiGene App**.

## 4. Retrieve Your API Key

1. Log in to the main FederiGene Web Dashboard.
2. Navigate to **Organization Settings -> API Keys**.
3. Generate a new API key and copy it. **Keep this key secure.** It acts as your hospital's cryptographic identity when syncing weights.

## 5. Running a Local Training Job

1. Open the **FederiGene Desktop App**.
2. In the sidebar, navigate to the **Local Node Configuration** page.
3. **Connect to Platform:**
   - Enter the Platform URL (e.g., `https://api.federigene.com`).
   - Paste your generated **API Key**.
4. **Select Dataset:**
   - Use the native file picker to locate your genomic data (e.g., `.csv` or `.vcf` files) securely stored on your local machine.
5. **Start Training:**
   - Enter the Job ID assigned to your hospital by the lead researcher.
   - Click **Start Local Training**. 
   - A secure background process will begin. You can watch the live terminal output directly within the app as PyTorch trains the neural network locally. Once complete, only the encrypted weights (the mathematical learnings) are pushed back to the central server.
