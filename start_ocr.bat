@echo off
rem 用独立 venv 启动 PaddleOCR 代理（不污染全局 Python 环境）
cd /d "%~dp0"
ocr_venv\Scripts\python.exe ocr_server.py
