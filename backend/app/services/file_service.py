# backend/app/services/file_service.py
import os
import json
from pathlib import Path
from typing import List, Dict, Optional
import stat
import platform

class FileService:
    def __init__(self):
        self.allowed_extensions = {
            '.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.sass',
            '.json', '.yaml', '.yml', '.md', '.txt', '.sql', '.sh', '.bat', '.ps1',
            '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs',
            '.swift', '.kt', '.scala', '.dart', '.r', '.xml', '.ini', '.cfg', '.conf',
            '.toml', '.lock', '.log', '.env', '.gitignore', '.dockerfile', '.makefile'
        }
        
        # Set up allowed paths for broader access
        self.allowed_paths = self._get_allowed_paths()
        
        # Common directories to skip
        self.skip_directories = {
            'node_modules', '__pycache__', '.git', 'venv', '.venv', 'env', '.env',
            'dist', 'build', 'target', 'bin', 'obj', '.idea', '.vscode',
            'coverage', '.nyc_output', '.pytest_cache', '__pycache__'
        }
        
        # Hidden files to include (whitelist)
        self.include_hidden = {'.env', '.gitignore', '.gitattributes', '.eslintrc', '.prettierrc'}
    
    def _get_allowed_paths(self) -> List[str]:
        """Get list of allowed base paths for file access"""
        paths = []
        
        # Current working directory
        paths.append(os.getcwd())
        
        # User home directory
        home = os.path.expanduser("~")
        if os.path.exists(home):
            paths.append(home)
        
        # Common development directories based on OS
        if platform.system() == "Windows":
            # Windows common paths
            common_paths = [
                "C:\\Users",
                "D:\\Programming",
                "C:\\Programming",
                "C:\\Code",
                "D:\\Code",
                "C:\\Projects",
                "D:\\Projects"
            ]
        else:
            # Linux/Mac common paths
            common_paths = [
                "/home",
                "/Users",
                "/opt",
                "/usr/local",
                f"{home}/Documents",
                f"{home}/Desktop",
                f"{home}/Projects",
                f"{home}/Code",
                f"{home}/Development"
            ]
        
        # Add existing paths only
        for path in common_paths:
            if path and os.path.exists(path):
                paths.append(os.path.abspath(path))
        
        # Remove duplicates and sort
        return list(set(paths))
    
    def is_path_allowed(self, path: str) -> bool:
        """Check if the path is within allowed directories"""
        try:
            abs_path = os.path.abspath(path)
            
            # Allow if path starts with any allowed base path
            for allowed_path in self.allowed_paths:
                if abs_path.startswith(allowed_path):
                    return True
            
            # Also allow relative paths within current directory
            if not os.path.isabs(path):
                return True
                
            return False
        except Exception:
            return False
    
    def list_directory(self, path: str) -> List[Dict]:
        """List files and directories with security check"""
        try:
            # Security check
            if not self.is_path_allowed(path):
                # If path not allowed, fall back to current directory
                path = "."
            
            abs_path = os.path.abspath(path)
            items = []
            
            if not os.path.exists(abs_path):
                raise FileNotFoundError(f"Path does not exist: {path}")
            
            if not os.path.isdir(abs_path):
                raise NotADirectoryError(f"Path is not a directory: {path}")
            
            try:
                dir_items = os.listdir(abs_path)
            except PermissionError:
                raise Exception(f"Permission denied accessing directory: {path}")
            
            for item in dir_items:
                try:
                    item_path = os.path.join(abs_path, item)
                    
                    # Skip certain directories
                    if os.path.isdir(item_path) and item in self.skip_directories:
                        continue
                    
                    # Skip hidden files except whitelisted ones
                    if item.startswith('.') and item not in self.include_hidden:
                        continue
                    
                    # Get file stats
                    try:
                        stat_info = os.stat(item_path)
                        is_dir = os.path.isdir(item_path)
                        
                        file_info = {
                            "name": item,
                            "path": item_path,
                            "is_directory": is_dir,
                            "size": stat_info.st_size if not is_dir else 0,
                            "modified": stat_info.st_mtime,
                            "permissions": oct(stat_info.st_mode)[-3:],
                            "is_readable": os.access(item_path, os.R_OK),
                            "is_writable": os.access(item_path, os.W_OK)
                        }
                        
                        if not is_dir:
                            extension = Path(item).suffix.lower()
                            file_info["extension"] = extension
                            file_info["is_text_file"] = extension in self.allowed_extensions
                        
                        items.append(file_info)
                        
                    except (OSError, PermissionError):
                        # Skip files we can't access
                        continue
                        
                except Exception:
                    # Skip problematic items
                    continue
            
            # Sort: directories first, then files alphabetically
            items.sort(key=lambda x: (not x["is_directory"], x["name"].lower()))
            return items
            
        except Exception as e:
            raise Exception(f"Failed to list directory: {str(e)}")
    
    def read_file(self, path: str) -> str:
        """Read file content with security check"""
        try:
            # Security check
            if not self.is_path_allowed(path):
                raise PermissionError(f"Access denied to path: {path}")
            
            abs_path = os.path.abspath(path)
            
            if not os.path.exists(abs_path):
                raise FileNotFoundError(f"File not found: {path}")
            
            if os.path.isdir(abs_path):
                raise IsADirectoryError(f"Path is a directory: {path}")
            
            # Check if file is readable
            if not os.access(abs_path, os.R_OK):
                raise PermissionError(f"No read permission for file: {path}")
            
            # Check file size (limit to 50MB for safety)
            file_size = os.path.getsize(abs_path)
            if file_size > 50 * 1024 * 1024:
                raise Exception(f"File too large ({file_size / (1024*1024):.1f}MB > 50MB limit)")
            
            # Try different encodings
            encodings = ['utf-8', 'utf-16', 'latin1', 'cp1252']
            
            for encoding in encodings:
                try:
                    with open(abs_path, 'r', encoding=encoding) as file:
                        content = file.read()
                        
                    # Validate that we can work with this content
                    if len(content) > 1_000_000:  # 1MB text limit
                        content = content[:1_000_000] + "\n\n... (file truncated due to size)"
                    
                    return content
                    
                except UnicodeDecodeError:
                    if encoding == encodings[-1]:  # Last encoding failed
                        raise Exception("File contains non-text data or unsupported encoding")
                    continue
                    
        except Exception as e:
            raise Exception(f"Failed to read file: {str(e)}")
    
    def write_file(self, path: str, content: str) -> bool:
        """Write content to file with security check"""
        try:
            # Security check
            if not self.is_path_allowed(path):
                raise PermissionError(f"Access denied to path: {path}")
            
            abs_path = os.path.abspath(path)
            
            # Create directory if it doesn't exist
            directory = os.path.dirname(abs_path)
            if directory and not os.path.exists(directory):
                try:
                    os.makedirs(directory, exist_ok=True)
                except PermissionError:
                    raise PermissionError(f"Cannot create directory: {directory}")
            
            # Check if we can write to the directory
            if not os.access(directory, os.W_OK):
                raise PermissionError(f"No write permission for directory: {directory}")
            
            # Backup existing file if it exists
            backup_made = False
            if os.path.exists(abs_path):
                try:
                    backup_path = abs_path + ".bak"
                    if os.path.exists(backup_path):
                        os.remove(backup_path)
                    os.rename(abs_path, backup_path)
                    backup_made = True
                except Exception:
                    pass  # Continue without backup if it fails
            
            try:
                # Write the file with UTF-8 encoding
                with open(abs_path, 'w', encoding='utf-8', newline='') as file:
                    file.write(content)
                
                # Remove backup if write was successful
                if backup_made:
                    backup_path = abs_path + ".bak"
                    if os.path.exists(backup_path):
                        try:
                            os.remove(backup_path)
                        except Exception:
                            pass  # Keep backup if we can't remove it
                
                return True
                
            except Exception as write_error:
                # Restore backup if write failed
                if backup_made:
                    backup_path = abs_path + ".bak"
                    if os.path.exists(backup_path):
                        try:
                            os.rename(backup_path, abs_path)
                        except Exception:
                            pass
                raise write_error
            
        except Exception as e:
            raise Exception(f"Failed to write file: {str(e)}")
    
    def delete_file(self, path: str) -> bool:
        """Delete file or directory with security check"""
        try:
            # Security check
            if not self.is_path_allowed(path):
                raise PermissionError(f"Access denied to path: {path}")
            
            abs_path = os.path.abspath(path)
            
            if not os.path.exists(abs_path):
                raise FileNotFoundError(f"Path not found: {path}")
            
            # Check permissions
            if not os.access(abs_path, os.W_OK):
                raise PermissionError(f"No write permission for: {path}")
            
            if os.path.isdir(abs_path):
                # Only remove empty directories for safety
                try:
                    os.rmdir(abs_path)
                except OSError as e:
                    if e.errno == 39:  # Directory not empty
                        raise Exception("Cannot delete non-empty directory. Please empty it first.")
                    else:
                        raise Exception(f"Cannot delete directory: {str(e)}")
            else:
                # Delete file
                os.remove(abs_path)
            
            return True
            
        except Exception as e:
            raise Exception(f"Failed to delete: {str(e)}")
    
    def create_directory(self, path: str) -> bool:
        """Create a new directory"""
        try:
            # Security check
            if not self.is_path_allowed(path):
                raise PermissionError(f"Access denied to path: {path}")
            
            abs_path = os.path.abspath(path)
            
            if os.path.exists(abs_path):
                raise Exception(f"Path already exists: {path}")
            
            os.makedirs(abs_path, exist_ok=False)
            return True
            
        except Exception as e:
            raise Exception(f"Failed to create directory: {str(e)}")
    
    def get_file_info(self, path: str) -> Dict:
        """Get detailed file information"""
        try:
            # Security check
            if not self.is_path_allowed(path):
                raise PermissionError(f"Access denied to path: {path}")
            
            abs_path = os.path.abspath(path)
            
            if not os.path.exists(abs_path):
                raise FileNotFoundError(f"Path not found: {path}")
            
            stat_info = os.stat(abs_path)
            is_dir = os.path.isdir(abs_path)
            
            info = {
                "name": os.path.basename(abs_path),
                "path": abs_path,
                "is_directory": is_dir,
                "size": stat_info.st_size,
                "created": stat_info.st_ctime,
                "modified": stat_info.st_mtime,
                "accessed": stat_info.st_atime,
                "permissions": oct(stat_info.st_mode)[-3:],
                "is_readable": os.access(abs_path, os.R_OK),
                "is_writable": os.access(abs_path, os.W_OK),
                "is_executable": os.access(abs_path, os.X_OK)
            }
            
            if not is_dir:
                extension = Path(abs_path).suffix.lower()
                info["extension"] = extension
                info["is_text_file"] = extension in self.allowed_extensions
            
            return info
            
        except Exception as e:
            raise Exception(f"Failed to get file info: {str(e)}")
    
    def get_allowed_paths(self) -> List[str]:
        """Get list of allowed base paths (for frontend display)"""
        return self.allowed_paths.copy()
    
    def add_allowed_path(self, path: str) -> bool:
        """Add a new allowed path (for workspace selection)"""
        try:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path) and os.path.isdir(abs_path):
                if abs_path not in self.allowed_paths:
                    self.allowed_paths.append(abs_path)
                return True
            return False
        except Exception:
            return False
