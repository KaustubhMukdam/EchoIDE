# EchoIDE - AI-Powered Code Editor

🚀 **EchoIDE** is a modern, AI-powered desktop code editor and integrated development environment (IDE) built with React, Electron, and FastAPI. It supports multi-language syntax highlighting, intelligent AI code completion, integrated terminal, and real-time code execution for Python, JavaScript, and more.

---

## Features

- **AI-powered code completion:** Integrated AI assistant helps you write code faster and smarter.
- **Multi-language support:** Syntax highlighting and editing for Python, JavaScript, TypeScript, C++, Java, and many more.
- **Real-time code execution:** Run and test your code instantly inside the integrated terminal.
- **File Explorer:** Browse, create, rename, delete files and folders easily.
- **Tabbed interface:** Switch between code editor, terminal, AI assistant chat seamlessly.
- **Dark theme:** Beautiful modern UI optimized for long coding sessions.
- **Cross-platform desktop app:** Runs on Windows, macOS, and Linux.

---

## Tech Stack

- **Frontend:** React, Monaco Editor, Electron for desktop packaging  
- **Backend:** FastAPI (Python) for code execution and AI services  
- **AI:** Integrates OpenAI API and custom models for assistance  
- **Bundling & Build:** Electron-builder for app installers  
- **State Management:** React Hooks and Context API

---

## Demo Video

![EchoIDE Demo](./docs/echoide-demo.gif)

(Include a visual demo here—for LinkedIn and GitHub showcase)

---

## Getting Started

### Prerequisites

- Node.js >= 16.x  
- npm or yarn  
- Python 3.8+ (for backend API)  
- OpenAI API key (optional, for AI features)

### Installation

1. Clone the repo:

git clone https://github.com/KaustubhMukdam/EchoIDE.git
cd echoide/frontend

2. Install dependencies:

npm install

3. Start backend API:

cd ../backend
pip install -r requirements.txt
uvicorn main:app --reload

4. Start frontend desktop app:

cd ../frontend
npm run dev

---

## Building the App

To build production-ready installers:
npm run build-win # For Windows installer (.exe)
npm run build-mac # For macOS installer (.dmg)
npm run build-linux # For Linux (.AppImage, .deb, .rpm)

Or build portable app without installer:

npm run pack

---

## Folder Structure

EchoIDE/
├── backend/ # FastAPI backend with code execution
├── frontend/ # React + Electron frontend
│ ├── public/ # Static assets (icons, electron scripts)
│ ├── src/ # React source code
│ ├── build/ # Production web build (output)
│ └── package.json # Frontend package config
├── .gitignore
├── README.md
└── LICENSE
---

## Contributing

Contributions are welcome!

- File issues and feature requests on GitHub.  
- Fork the repo and submit pull requests.  
- Follow coding style and write tests for new features.

---

## License

This project is licensed under the MIT License.

---

## Contact

Kaustubh — [Your Email]  
Project Link: https://github.com/yourusername/echoide

---

Thank you for checking out EchoIDE - your next-generation AI-powered desktop IDE!

