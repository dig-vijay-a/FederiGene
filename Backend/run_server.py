import uvicorn
import sys
import os

from main import app

if __name__ == "__main__":
    # If running as PyInstaller executable, set the working directory to the extracted temp folder
    if hasattr(sys, '_MEIPASS'):
        os.chdir(sys._MEIPASS)

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
