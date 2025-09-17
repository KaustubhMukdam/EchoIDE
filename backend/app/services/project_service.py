# backend/services/project_service.py
import os
import json
from pathlib import Path
from typing import Dict, List, Optional

class ProjectService:
    def __init__(self):
        self.project_files = {
            'package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml',
            'go.mod', 'composer.json', '.gitignore', 'README.md'
        }
    
    def open_project(self, project_path: str) -> Dict:
        """Open and analyze a project directory"""
        try:
            abs_path = os.path.abspath(project_path)
            
            if not os.path.exists(abs_path) or not os.path.isdir(abs_path):
                raise Exception("Invalid project directory")
            
            project_info = {
                "name": os.path.basename(abs_path),
                "path": abs_path,
                "type": self._detect_project_type(abs_path),
                "files_count": self._count_files(abs_path),
                "main_files": self._find_main_files(abs_path),
                "languages": self._detect_languages(abs_path)
            }
            
            return project_info
            
        except Exception as e:
            raise Exception(f"Failed to open project: {str(e)}")
    
    def get_project_structure(self, project_path: str, max_depth: int = 3) -> Dict:
        """Get hierarchical project structure"""
        try:
            abs_path = os.path.abspath(project_path)
            return self._build_tree(abs_path, max_depth, 0)
            
        except Exception as e:
            raise Exception(f"Failed to get project structure: {str(e)}")
    
    def _detect_project_type(self, path: str) -> str:
        """Detect project type based on files"""
        files = os.listdir(path)
        
        if 'package.json' in files:
            return 'Node.js'
        elif 'requirements.txt' in files or 'setup.py' in files:
            return 'Python'
        elif 'Cargo.toml' in files:
            return 'Rust'
        elif 'pom.xml' in files:
            return 'Java (Maven)'
        elif 'go.mod' in files:
            return 'Go'
        elif any(f.endswith('.csproj') for f in files):
            return 'C#'
        else:
            return 'Unknown'
    
    def _count_files(self, path: str) -> int:
        """Count total files in project"""
        count = 0
        for root, dirs, files in os.walk(path):
            # Skip common ignore directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '__pycache__', '.git', 'venv', 'target']]
            count += len(files)
        return count
    
    def _find_main_files(self, path: str) -> List[str]:
        """Find main/important files in project"""
        main_files = []
        
        for file in os.listdir(path):
            if file in self.project_files:
                main_files.append(file)
        
        return main_files
    
    def _detect_languages(self, path: str) -> List[str]:
        """Detect programming languages used in project"""
        extensions = set()
        
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '__pycache__', '.git', 'venv']]
            
            for file in files:
                ext = Path(file).suffix
                if ext:
                    extensions.add(ext)
        
        language_map = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust'
        }
        
        languages = [language_map.get(ext, ext) for ext in extensions if ext in language_map]
        return list(set(languages))
    
    def _build_tree(self, path: str, max_depth: int, current_depth: int) -> Dict:
        """Build directory tree structure"""
        if current_depth >= max_depth:
            return {"name": os.path.basename(path), "type": "directory", "truncated": True}
        
        tree = {
            "name": os.path.basename(path) or path,
            "path": path,
            "type": "directory",
            "children": []
        }
        
        try:
            items = os.listdir(path)
            items.sort()
            
            for item in items:
                if item.startswith('.') or item in ['node_modules', '__pycache__', 'venv']:
                    continue
                
                item_path = os.path.join(path, item)
                
                if os.path.isdir(item_path):
                    child_tree = self._build_tree(item_path, max_depth, current_depth + 1)
                    tree["children"].append(child_tree)
                else:
                    tree["children"].append({
                        "name": item,
                        "path": item_path,
                        "type": "file",
                        "extension": Path(item).suffix
                    })
                    
        except PermissionError:
            tree["error"] = "Permission denied"
        
        return tree
