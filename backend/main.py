# backend/main.py - Complete version with execute endpoint
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from datetime import datetime
import subprocess
import time
from pathlib import Path

from app.services.ai_services import AIService
from app.services.file_service import FileService
from app.services.project_service import ProjectService

# Initialize FastAPI app
app = FastAPI(title="EchoIDE Backend", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_service = AIService()
file_service = FileService()
project_service = ProjectService()

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "deepseek-coder:6.7b"
    language: Optional[str] = "python"
    context: Optional[str] = ""
    session_id: Optional[str] = "default"

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str
    analysis_type: str  # "explain", "debug", "optimize", "review"

class CodeCompletionRequest(BaseModel):
    code: str
    cursor_position: int
    language: str

class FileContent(BaseModel):
    path: str
    content: str

class ExecuteRequest(BaseModel):
    executor: str
    filename: str
    workspace: str

# AI Endpoints
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        response = await ai_service.chat(
            request.message, 
            request.model, 
            request.language, 
            request.context, 
            request.session_id
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/code/analyze")
async def analyze_code(request: CodeAnalysisRequest):
    try:
        analysis = await ai_service.analyze_code(
            request.code, 
            request.language, 
            request.analysis_type
        )
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/code/complete")
async def complete_code(request: CodeCompletionRequest):
    try:
        completion = await ai_service.complete_code(
            request.code, 
            request.cursor_position, 
            request.language
        )
        return {"completion": completion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# File Management Endpoints
@app.get("/api/files/list")
async def list_files(path: str = "."):
    try:
        files = file_service.list_directory(path)
        return {"files": files, "current_path": path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/files/read")
async def read_file(path: str):
    try:
        content = file_service.read_file(path)
        return {"content": content, "path": path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/files/write")
async def write_file(file_content: FileContent):
    try:
        success = file_service.write_file(file_content.path, file_content.content)
        return {"success": success, "message": f"File saved: {file_content.path}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/files/delete")
async def delete_file(path: str):
    try:
        success = file_service.delete_file(path)
        return {"success": success, "message": f"File deleted: {path}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/files/info")
async def get_file_info(path: str):
    try:
        info = file_service.get_file_info(path)
        return info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/files/create-directory")
async def create_directory(request: dict):
    try:
        path = request.get("path")
        if not path:
            raise HTTPException(status_code=400, detail="Path is required")
        
        success = file_service.create_directory(path)
        return {"success": success, "message": f"Directory created: {path}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/files/allowed-paths")
async def get_allowed_paths():
    try:
        paths = file_service.get_allowed_paths()
        return {"allowed_paths": paths}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/add-workspace")
async def add_workspace(request: dict):
    try:
        path = request.get("workspace_path")
        if not path:
            raise HTTPException(status_code=400, detail="Workspace path is required")
        
        success = file_service.add_allowed_path(path)
        if success:
            return {"success": True, "message": f"Workspace added: {path}"}
        else:
            raise HTTPException(status_code=400, detail="Invalid workspace path")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# CODE EXECUTION ENDPOINT - This was missing!
@app.post("/api/execute")
async def execute_code(request: ExecuteRequest):
    try:
        executor = request.executor  # python, node, java, g++, gcc
        filename = request.filename
        workspace = request.workspace
        
        if not executor or not filename:
            raise HTTPException(status_code=400, detail="Executor and filename required")
        
        # Security check
        if not file_service.is_path_allowed(workspace):
            raise HTTPException(status_code=403, detail="Access denied to workspace")
        
        file_path = os.path.join(workspace, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {filename}")
        
        start_time = time.time()
        result = await execute_file(executor, file_path, workspace)
        execution_time = round(time.time() - start_time, 3)
        
        result["execution_time"] = execution_time
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def execute_file(executor: str, file_path: str, workspace: str):
    """Execute file based on executor type"""
    
    try:
        if executor == "python":
            # Execute Python file
            process = subprocess.run(
                ["python", file_path],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30  # 30 second timeout
            )
            
        elif executor == "node":
            # Execute JavaScript file
            process = subprocess.run(
                ["node", file_path],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30
            )
            
        elif executor == "java":
            # Compile and execute Java file
            class_name = Path(file_path).stem
            
            # Compile first
            compile_process = subprocess.run(
                ["javac", file_path],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30
            )
            
            if compile_process.returncode != 0:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": compile_process.stderr,
                    "exit_code": compile_process.returncode,
                    "error": "Compilation failed"
                }
            
            # Execute compiled class
            process = subprocess.run(
                ["java", class_name],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30
            )
            
        elif executor == "g++":
            # Compile and execute C++ file
            executable_name = Path(file_path).stem
            if os.name == 'nt':  # Windows
                executable_path = os.path.join(workspace, f"{executable_name}.exe")
            else:  # Linux/Mac
                executable_path = os.path.join(workspace, executable_name)
            
            # Compile first
            compile_process = subprocess.run(
                ["g++", file_path, "-o", executable_path],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30
            )
            
            if compile_process.returncode != 0:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": compile_process.stderr,
                    "exit_code": compile_process.returncode,
                    "error": "Compilation failed"
                }
            
            # Execute compiled binary
            process = subprocess.run(
                [executable_path],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30
            )
            
        elif executor == "gcc":
            # Similar to g++ but for C files
            executable_name = Path(file_path).stem
            if os.name == 'nt':  # Windows
                executable_path = os.path.join(workspace, f"{executable_name}.exe")
            else:  # Linux/Mac
                executable_path = os.path.join(workspace, executable_name)
            
            compile_process = subprocess.run(
                ["gcc", file_path, "-o", executable_path],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30
            )
            
            if compile_process.returncode != 0:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": compile_process.stderr,
                    "exit_code": compile_process.returncode,
                    "error": "Compilation failed"
                }
            
            process = subprocess.run(
                [executable_path],
                capture_output=True,
                text=True,
                cwd=workspace,
                timeout=30
            )
            
        else:
            return {
                "success": False,
                "error": f"Unsupported executor: {executor}"
            }
        
        return {
            "success": process.returncode == 0,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "exit_code": process.returncode
        }
        
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Execution timeout (30 seconds)"
        }
    except FileNotFoundError as e:
        return {
            "success": False,
            "error": f"Runtime not found: {str(e)}. Make sure Python is installed and in your PATH."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Project Management Endpoints
@app.post("/api/project/open")
async def open_project(request: dict):
    try:
        project_path = request.get("project_path")
        if not project_path:
            raise HTTPException(status_code=400, detail="Project path is required")
        
        success = project_service.open_project(project_path)
        return {"success": success, "message": f"Project opened: {project_path}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/project/structure")
async def get_project_structure(project_path: str):
    try:
        structure = project_service.get_project_structure(project_path)
        return {"structure": structure}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "EchoIDE Backend API", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
