#!/usr/bin/env bash
set -euo pipefail

# ====== CHECK CURRENT FOLDER ======
CURRENT_DIR_NAME="${PWD##*/}"
if [[ "$CURRENT_DIR_NAME" != "CSV-To-Excel" ]]; then
  echo "====================================================="
  echo " Please run this script from the folder: CSV-To-Excel"
  echo " Current folder: $CURRENT_DIR_NAME"
  echo "====================================================="
  exit 1
fi

# ====== Detect package manager ======
install_cmd=""
if command -v apt-get &> /dev/null; then
  install_cmd="sudo apt-get install -y"
elif command -v yum &> /dev/null; then
  install_cmd="sudo yum install -y"
elif command -v pacman &> /dev/null; then
  install_cmd="sudo pacman -S --noconfirm"
elif command -v zypper &> /dev/null; then
  install_cmd="sudo zypper install -y"
else
  echo "Unsupported package manager. Please install git, nodejs, python3 manually."
  exit 1
fi

echo "[1/4] Checking and installing dependencies..."

# ====== Check and install git ======
if ! command -v git &> /dev/null; then
  echo "Git not found. Installing git..."
  $install_cmd git
else
  echo "Git found."
fi

# ====== Check and install node ======
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Installing nodejs and npm..."
  if [[ "$install_cmd" == "sudo apt-get install -y" ]]; then
    sudo apt-get update
    $install_cmd nodejs npm
  else
    $install_cmd nodejs npm
  fi
else
  echo "Node.js found."
fi

# ====== Check and install python ======
if ! command -v python3 &> /dev/null; then
  echo "Python3 not found. Installing python3 and python3-venv..."
  $install_cmd python3 python3-venv python3-pip
else
  echo "Python3 found."
fi

# ====== STEP 2: Setup Python venv and dependencies ======
echo "[2/4] Setting up Python environment..."

if [ ! -d "./venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install openpyxl pyinstaller

echo "Running npm install..."
npm install

# ====== STEP 3: Clean and build Python executables ======
echo "[3/4] Cleaning build folder and building Python executables..."

# Kill running executables if any
for proc in run CSV-To-Excel; do
  if pgrep -x "$proc" > /dev/null; then
    echo "Found running $proc - terminating..."
    pkill -f "$proc"
  fi
done

if [ -d "build" ]; then
  echo "Deleting contents of build folder..."
  rm -rf build
fi

mkdir -p build

# Build first exe: run.py
pyinstaller backend/run.py --noconsole --onefile --distpath build --name run

# Build second exe: CSV-To-Excel.py
pyinstaller backend/CSV-To-Excel.py --noconsole --onefile --distpath build --name CSV-To-Excel

# ====== STEP 4: Build Node executable ======
echo "[4/4] Building Node executable..."
npx pkg . --output build/CSV-To-Excel_main.exe --targets node18-linux-x64

echo "==== Done! All executables are in the build folder ===="
deactivate
