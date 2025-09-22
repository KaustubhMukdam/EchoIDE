# ⚡ Project 4/20 – EchoIDE: AI-Powered Code Editor

*Part of my **100 Days of Code – Portfolio Project Series*** 

🚀 **EchoIDE** is a modern, AI-powered desktop code editor and integrated development environment (IDE) built with React, Electron, and FastAPI. It supports multi-language syntax highlighting, intelligent AI code completion, integrated terminal, and real-time code execution for Python, JavaScript, and more.

🔗 **GitHub Repo**: [EchoIDE](https://github.com/KaustubhMukdam/EchoIDE.git)  

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

![EchoIDE Demo](https://drive.google.com/file/d/1fB5Z8MJveUcab5oLuAyj4ue_L1V70N9W/view?usp=sharing)

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

📚 Learning Outcomes

Architecting a full-stack desktop application with AI integration

Designing for cross-platform compatibility

Improving developer experience (DX) with smart editor features

Packaging desktop apps using Electron-builder

Lessons in software architecture & UX design

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

## 👨‍💻 Author

### Kaustubh Mukdam

GitHub: [@KaustubhMukdam](https://github.com/KaustubhMukdam)

LinkedIn: [Kaustubh Mukdam](https://www.linkedin.com/in/kaustubh-mukdam-ab0170340/)
---

## ⭐ If you liked this project, please give it a star!

---

Thank you for checking out EchoIDE - your next-generation AI-powered desktop IDE!

