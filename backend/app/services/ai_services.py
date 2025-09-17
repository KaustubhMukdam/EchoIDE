# backend/app/services/ai_services.py
import requests
from typing import Dict, List, Optional
import json
from datetime import datetime

class AIService:
    def __init__(self):
        self.base_url = "http://localhost:11434"
        self.sessions: Dict[str, List] = {}  # Store conversation history
        
    async def chat(self, message: str, model: str, language: str, 
                  context: str, session_id: str) -> str:
        """Enhanced chat with context and session management"""
        
        # Get session history
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        
        session_history = self.sessions[session_id]
        
        # Build messages array for /api/chat
        messages = []
        
        # Add system message
        system_content = f"You are an expert {language} developer and coding assistant."
        if context:
            system_content += f" Context: {context}"
        messages.append({"role": "system", "content": system_content})
        
        # Add conversation history
        for exchange in session_history[-3:]:  # Last 3 exchanges
            messages.append({"role": "user", "content": exchange['user']})
            messages.append({"role": "assistant", "content": exchange['assistant']})
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 1000,
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()["message"]["content"]
            
            # Store in session history
            self.sessions[session_id].append({
                "timestamp": datetime.now().isoformat(),
                "user": message,
                "assistant": result,
                "context": context
            })
            
            # Keep only last 10 exchanges to manage memory
            if len(self.sessions[session_id]) > 10:
                self.sessions[session_id] = self.sessions[session_id][-10:]
            
            return result
            
        except Exception as e:
            raise Exception(f"AI request failed: {str(e)}")
    
    async def analyze_code(self, code: str, language: str, analysis_type: str) -> str:
        """Analyze code for different purposes with language-specific context"""
        
        # Language-specific analysis prompts
        language_specific_prompts = {
            "explain": {
                "python": f"Explain this Python code in detail, including Pythonic concepts, PEP 8 compliance, and best practices:",
                "javascript": f"Explain this JavaScript code in detail, including ES6+ features, async patterns, and modern JavaScript practices:",
                "typescript": f"Explain this TypeScript code in detail, including type safety, interfaces, and TypeScript-specific features:",
                "java": f"Explain this Java code in detail, including OOP principles, design patterns, and Java best practices:",
                "cpp": f"Explain this C++ code in detail, including memory management, RAII, and modern C++ features:",
                "csharp": f"Explain this C# code in detail, including .NET features, LINQ, and C# best practices:",
                "go": f"Explain this Go code in detail, including goroutines, channels, and Go idioms:",
                "rust": f"Explain this Rust code in detail, including ownership, borrowing, and Rust safety features:",
                "php": f"Explain this PHP code in detail, including PSR standards and modern PHP practices:",
                "ruby": f"Explain this Ruby code in detail, including Ruby idioms, blocks, and metaprogramming:",
                "html": f"Explain this HTML code in detail, including semantic markup, accessibility, and HTML5 features:",
                "css": f"Explain this CSS code in detail, including layout techniques, responsive design, and modern CSS features:"
            },
            "debug": {
                "python": f"Find potential bugs and issues in this Python code, considering Python-specific pitfalls, type errors, and common mistakes:",
                "javascript": f"Find potential bugs and issues in this JavaScript code, considering async/await issues, type coercion, and common JavaScript pitfalls:",
                "typescript": f"Find potential bugs and issues in this TypeScript code, considering type safety violations, null/undefined issues, and TypeScript-specific problems:",
                "java": f"Find potential bugs and issues in this Java code, considering null pointer exceptions, memory leaks, and Java-specific problems:",
                "cpp": f"Find potential bugs and issues in this C++ code, considering memory leaks, buffer overflows, and undefined behavior:",
                "csharp": f"Find potential bugs and issues in this C# code, considering null reference exceptions, disposal patterns, and C#-specific issues:",
                "go": f"Find potential bugs and issues in this Go code, considering race conditions, error handling, and Go-specific pitfalls:",
                "rust": f"Find potential bugs and issues in this Rust code, considering lifetime issues, ownership violations, and Rust-specific problems:",
                "php": f"Find potential bugs and issues in this PHP code, considering security vulnerabilities, type juggling, and PHP-specific issues:",
                "ruby": f"Find potential bugs and issues in this Ruby code, considering nil errors, method visibility, and Ruby-specific problems:",
                "html": f"Find potential issues in this HTML code, considering accessibility problems, semantic markup violations, and validation errors:",
                "css": f"Find potential issues in this CSS code, considering browser compatibility, specificity conflicts, and layout problems:"
            },
            "optimize": {
                "python": f"Suggest optimizations for this Python code using Python-specific performance techniques, list comprehensions, and efficient algorithms:",
                "javascript": f"Suggest optimizations for this JavaScript code using modern JS features, efficient DOM manipulation, and performance best practices:",
                "typescript": f"Suggest optimizations for this TypeScript code using strong typing for performance, efficient patterns, and TypeScript optimizations:",
                "java": f"Suggest optimizations for this Java code using JVM optimizations, efficient collections, and Java performance patterns:",
                "cpp": f"Suggest optimizations for this C++ code using move semantics, RAII, memory efficiency, and modern C++ performance techniques:",
                "csharp": f"Suggest optimizations for this C# code using LINQ efficiency, async patterns, and .NET performance best practices:",
                "go": f"Suggest optimizations for this Go code using goroutine patterns, efficient memory usage, and Go performance idioms:",
                "rust": f"Suggest optimizations for this Rust code using zero-cost abstractions, efficient memory usage, and Rust performance patterns:",
                "php": f"Suggest optimizations for this PHP code using efficient database queries, caching strategies, and PHP performance best practices:",
                "ruby": f"Suggest optimizations for this Ruby code using efficient enumerable methods, memory optimization, and Ruby performance patterns:",
                "html": f"Suggest optimizations for this HTML code including faster loading, better SEO, and improved accessibility:",
                "css": f"Suggest optimizations for this CSS code including performance improvements, better maintainability, and modern CSS techniques:"
            },
            "review": {
                "python": f"Perform a comprehensive code review of this Python code, checking for PEP 8 compliance, Pythonic patterns, security, and maintainability:",
                "javascript": f"Perform a comprehensive code review of this JavaScript code, checking for ES6+ usage, error handling, security, and code quality:",
                "typescript": f"Perform a comprehensive code review of this TypeScript code, checking for type safety, interface design, generics usage, and best practices:",
                "java": f"Perform a comprehensive code review of this Java code, checking for OOP principles, design patterns, exception handling, and Java conventions:",
                "cpp": f"Perform a comprehensive code review of this C++ code, checking for RAII, memory safety, modern C++ usage, and performance:",
                "csharp": f"Perform a comprehensive code review of this C# code, checking for .NET guidelines, SOLID principles, async patterns, and maintainability:",
                "go": f"Perform a comprehensive code review of this Go code, checking for Go conventions, error handling, concurrency safety, and simplicity:",
                "rust": f"Perform a comprehensive code review of this Rust code, checking for safety, ownership patterns, error handling, and Rust idioms:",
                "php": f"Perform a comprehensive code review of this PHP code, checking for PSR compliance, security vulnerabilities, and modern PHP practices:",
                "ruby": f"Perform a comprehensive code review of this Ruby code, checking for Ruby style guide compliance, object-oriented design, and best practices:",
                "html": f"Perform a comprehensive review of this HTML code, checking for semantic markup, accessibility, SEO, and HTML5 best practices:",
                "css": f"Perform a comprehensive review of this CSS code, checking for maintainability, responsive design, browser compatibility, and modern CSS practices:"
            }
        }
        
        # Get language-specific prompt or fall back to generic
        prompt_dict = language_specific_prompts.get(analysis_type, {})
        prompt = prompt_dict.get(language, f"Perform {analysis_type} analysis on this {language} code:")
        
        full_prompt = f"{prompt}\n\n``````\n\nPlease provide detailed analysis specific to {language} language features and best practices."
        
        messages = [
            {"role": "system", "content": f"You are an expert {language} developer and code reviewer with deep knowledge of {language} best practices, common pitfalls, optimization techniques, and security considerations. Provide detailed, actionable feedback."},
            {"role": "user", "content": full_prompt}
        ]
        
        payload = {
            "model": "deepseek-coder:6.7b",
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_predict": 2000,  # Allow longer analysis
                "top_p": 0.9
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=90)
            response.raise_for_status()
            return response.json()["message"]["content"]
        except Exception as e:
            raise Exception(f"Code analysis failed: {str(e)}")
    
    async def complete_code(self, code: str, cursor_position: int, language: str) -> str:
        """Generate language-specific code completion suggestions"""
        
        before_cursor = code[:cursor_position]
        after_cursor = code[cursor_position:]
        
        # Language-specific contexts and examples
        language_contexts = {
            'python': {
                'context': 'You are an expert Python developer. Complete the Python code following PEP 8 guidelines.',
                'style': 'Use Pythonic idioms, list comprehensions, context managers, and proper exception handling.',
                'patterns': 'Prefer enumerate() over range(len()), use f-strings, leverage duck typing, and follow the Zen of Python.',
                'examples': 'Use generators for memory efficiency, proper imports, and type hints where appropriate.'
            },
            'javascript': {
                'context': 'You are an expert JavaScript developer. Complete the JavaScript code using modern ES6+ syntax.',
                'style': 'Use arrow functions, destructuring, template literals, and async/await patterns.',
                'patterns': 'Prefer const/let over var, use array methods like map/filter/reduce, and proper error handling.',
                'examples': 'Use modules, promises, and modern DOM manipulation techniques.'
            },
            'typescript': {
                'context': 'You are an expert TypeScript developer. Complete the TypeScript code with proper type annotations.',
                'style': 'Include explicit types, use interfaces and generics appropriately, and leverage TypeScript\'s type system.',
                'patterns': 'Use union types, optional properties, type guards, and proper module declarations.',
                'examples': 'Implement type-safe code with proper error handling and null checks.'
            },
            'java': {
                'context': 'You are an expert Java developer. Complete the Java code following Java conventions and best practices.',
                'style': 'Use proper naming conventions, follow OOP principles, and implement appropriate design patterns.',
                'patterns': 'Use proper exception handling, generics, and collections framework efficiently.',
                'examples': 'Implement clean interfaces, use streams API, and follow SOLID principles.'
            },
            'cpp': {
                'context': 'You are an expert C++ developer. Complete the C++ code using modern C++ standards (C++11/14/17/20).',
                'style': 'Use RAII, smart pointers, range-based loops, and move semantics.',
                'patterns': 'Prefer STL containers and algorithms, use const correctness, and avoid raw pointers.',
                'examples': 'Implement exception-safe code with proper resource management and modern C++ features.'
            },
            'csharp': {
                'context': 'You are an expert C# developer. Complete the C# code following .NET conventions and best practices.',
                'style': 'Use proper naming conventions, LINQ where appropriate, and async/await patterns.',
                'patterns': 'Implement proper disposal patterns, use generics, and follow Microsoft\'s coding guidelines.',
                'examples': 'Use nullable reference types, expression-bodied members, and modern C# features.'
            },
            'go': {
                'context': 'You are an expert Go developer. Complete the Go code following Go conventions and idiomatic patterns.',
                'style': 'Use simple, readable code with proper error handling and Go naming conventions.',
                'patterns': 'Prefer composition over inheritance, use goroutines and channels appropriately.',
                'examples': 'Implement clean interfaces, proper error handling, and concurrent patterns where needed.'
            },
            'rust': {
                'context': 'You are an expert Rust developer. Complete the Rust code using safe Rust practices and idioms.',
                'style': 'Use ownership and borrowing correctly, prefer immutability, and handle errors explicitly.',
                'patterns': 'Use pattern matching, iterators, and Rust\'s type system effectively.',
                'examples': 'Implement memory-safe code with zero-cost abstractions and proper error handling.'
            },
            'php': {
                'context': 'You are an expert PHP developer. Complete the PHP code following PSR standards and modern PHP practices.',
                'style': 'Use type hints, proper namespacing, and follow PSR-4 autoloading standards.',
                'patterns': 'Implement proper error handling, use composer packages, and follow SOLID principles.',
                'examples': 'Use modern PHP features like traits, generators, and null coalescing operators.'
            },
            'ruby': {
                'context': 'You are an expert Ruby developer. Complete the Ruby code following Ruby style guide and idiomatic patterns.',
                'style': 'Use blocks and iterators, follow Ruby naming conventions, and embrace Ruby\'s expressiveness.',
                'patterns': 'Prefer symbols over strings for keys, use proper metaprogramming, and follow DRY principles.',
                'examples': 'Implement clean object-oriented design with proper use of modules and mixins.'
            },
            'html': {
                'context': 'You are an expert HTML developer. Complete the HTML code using semantic HTML5 elements.',
                'style': 'Use proper document structure, semantic tags, and accessibility attributes.',
                'patterns': 'Implement progressive enhancement, proper form handling, and SEO-friendly markup.',
                'examples': 'Use ARIA attributes, proper heading hierarchy, and valid HTML5 syntax.'
            },
            'css': {
                'context': 'You are an expert CSS developer. Complete the CSS code using modern CSS practices.',
                'style': 'Use flexbox/grid for layouts, CSS custom properties, and responsive design principles.',
                'patterns': 'Follow BEM methodology, use proper cascade and specificity, and mobile-first approach.',
                'examples': 'Implement efficient selectors, use modern CSS features, and maintain clean architecture.'
            },
            'sql': {
                'context': 'You are an expert SQL developer. Complete the SQL code following best practices and standards.',
                'style': 'Use proper formatting, efficient joins, and appropriate indexing strategies.',
                'patterns': 'Avoid N+1 queries, use proper normalization, and implement secure query patterns.',
                'examples': 'Use CTEs, window functions, and proper transaction handling where appropriate.'
            },
            'shell': {
                'context': 'You are an expert shell script developer. Complete the shell script using bash best practices.',
                'style': 'Use proper error handling, quote variables, and follow POSIX standards where possible.',
                'patterns': 'Use functions for reusability, proper exit codes, and defensive programming.',
                'examples': 'Implement proper input validation, use appropriate shell built-ins, and handle edge cases.'
            }
        }
        
        # Get language-specific information or use generic fallback
        lang_info = language_contexts.get(language, {
            'context': f'You are an expert {language} developer. Complete the {language} code.',
            'style': f'Follow {language} best practices and conventions.',
            'patterns': f'Use appropriate {language} patterns and idioms.',
            'examples': f'Implement clean, readable {language} code.'
        })
        
        # Analyze the code context to provide better completions
        context_analysis = self._analyze_code_context(before_cursor, language)
        
        prompt = f"""{lang_info['context']} {lang_info['style']}

{lang_info['patterns']} {lang_info['examples']}

Context Analysis: {context_analysis}

Complete the following {language} code at the cursor position. Provide ONLY the completion code that should be inserted at the cursor, nothing else.

Code before cursor:

{before_cursor}

Code after cursor:
{after_cursor}

Requirements:
- Language: {language}
- Provide only the missing code to complete the logic at the cursor position
- Follow {language}-specific syntax and conventions
- Consider the existing code structure and patterns
- Do not include explanations, comments, or formatting marks
- Ensure the completion integrates smoothly with existing code

Response format: Only return the raw code to be inserted, no markdown or explanations."""

        messages = [
            {
                "role": "system", 
                "content": f"You are an expert {language} code completion assistant specialized in {language} syntax, idioms, and best practices. Provide only the exact code that should be inserted at the cursor position, with no additional formatting or explanations."
            },
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": "deepseek-coder:6.7b",  # Use coding model for better completions
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.05,  # Very low temperature for predictable completions
                "num_predict": 200,   # Moderate length completions
                "top_p": 0.85,
                "top_k": 40,
                "repeat_penalty": 1.1,
                "stop": ["\n\n"]
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=45)
            response.raise_for_status()
            completion = response.json()["message"]["content"].strip()
            
            # Clean up the completion
            completion = self._clean_completion(completion, language)
            
            # Post-process for better integration
            completion = self._post_process_completion(completion, before_cursor, after_cursor, language)
            
            return completion
            
        except Exception as e:
            raise Exception(f"Code completion failed: {str(e)}")
    
    def _analyze_code_context(self, before_cursor: str, language: str) -> str:
        """Analyze the code context to provide better completions"""
        analysis = []
        
        # Check for common patterns
        if language == 'python':
            if 'def ' in before_cursor:
                analysis.append("Inside function definition")
            if 'class ' in before_cursor:
                analysis.append("Inside class definition")
            if 'for ' in before_cursor and ':' in before_cursor:
                analysis.append("Inside for loop")
            if 'if ' in before_cursor and ':' in before_cursor:
                analysis.append("Inside conditional block")
        
        elif language == 'javascript':
            if 'function' in before_cursor or '=>' in before_cursor:
                analysis.append("Inside function")
            if 'for(' in before_cursor or 'for (' in before_cursor:
                analysis.append("Inside for loop")
            if 'if(' in before_cursor or 'if (' in before_cursor:
                analysis.append("Inside conditional")
        
        elif language == 'java':
            if 'public ' in before_cursor or 'private ' in before_cursor:
                analysis.append("Inside method or class member")
            if 'for(' in before_cursor or 'for (' in before_cursor:
                analysis.append("Inside for loop")
            if 'class ' in before_cursor:
                analysis.append("Inside class definition")
        
        # Check indentation level
        lines = before_cursor.split('\n')
        if lines:
            last_line = lines[-1]
            indent_level = len(last_line) - len(last_line.lstrip())
            analysis.append(f"Indentation level: {indent_level}")
        
        return "; ".join(analysis) if analysis else "General code context"
    
    def _clean_completion(self, completion: str, language: str) -> str:
        """Clean up the completion response"""
        # Remove common unwanted prefixes
        unwanted_prefixes = [
            "Here's the completion:",
            "The completion is:",
            "You can complete it with:",
            "Here's what should be added:",
            "The missing code is:",
            "Complete with:",
            "Add this:",
            f"```{language}",
            "Here's the completed code:",
            "// Completion:",
            "# Completion:",
            "/* Completion:",
            "<!-- Completion:",
            "Completion:",
            "Answer:",
            "Response:",
            f"{language} completion:",
            f"The {language} code:",
            "Here's the missing part:",
            "You need to add:"
        ]
        
        completion_lower = completion.lower()
        for prefix in unwanted_prefixes:
            if completion_lower.startswith(prefix.lower()):
                completion = completion[len(prefix):].strip()
                completion_lower = completion.lower()
        
        # Remove unwanted suffixes
        unwanted_suffixes = [
            "```",
            "---",
            "***",
            "###",
            "~~~",
            "*/",
            "-->",
            "End of completion",
            "That's the completion",
            "This completes the code"
        ]
        
        for suffix in unwanted_suffixes:
            if completion.lower().endswith(suffix.lower()):
                completion = completion[:-len(suffix)].strip()
        
        # Remove excessive newlines at start/end but preserve internal structure
        completion = completion.strip('\n').rstrip()
        
        return completion
    
    def _post_process_completion(self, completion: str, before_cursor: str, after_cursor: str, language: str) -> str:
        """Post-process completion for better integration"""
        
        # Language-specific post-processing
        if language == 'python':
            # Ensure proper indentation for Python
            if before_cursor.endswith(':'):
                # After colon, add proper indentation
                if not completion.startswith(('\n    ', '\n\t')):
                    completion = '\n    ' + completion.lstrip()
        
        elif language in ['javascript', 'typescript', 'java', 'cpp', 'csharp']:
            # Handle bracket completion for C-style languages
            if before_cursor.endswith('{') and not after_cursor.startswith('}'):
                if not completion.endswith('}'):
                    completion = completion + '\n}'
        
        # Remove any duplicate whitespace
        import re
        completion = re.sub(r'\n\s*\n\s*\n', '\n\n', completion)
        
        return completion

    def _build_system_prompt(self, language: str, context: str) -> str:
        """Build system prompt based on language and context"""
        base_prompt = f"You are an expert {language} developer and coding assistant."
        
        if context:
            base_prompt += f" Context: {context}"
        
        base_prompt += " Provide accurate, helpful, and concise responses."
        return base_prompt
    
    def _build_conversation_prompt(self, system_prompt: str, history: List, current_message: str) -> str:
        """Build conversation prompt with history"""
        prompt_parts = [system_prompt]
        
        # Add recent conversation history
        for exchange in history[-3:]:  # Last 3 exchanges
            prompt_parts.append(f"User: {exchange['user']}")
            prompt_parts.append(f"Assistant: {exchange['assistant']}")
        
        prompt_parts.append(f"User: {current_message}")
        prompt_parts.append("Assistant:")
        
        return "\n\n".join(prompt_parts)