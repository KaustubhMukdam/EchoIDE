; Custom NSIS installer script for EchoIDE
!define PRODUCT_NAME "EchoIDE"
!define PRODUCT_DESCRIPTION "AI-Powered Code Editor"

; Custom messages
LangString UninstallLink ${LANG_ENGLISH} "Uninstall EchoIDE"
LangString DesktopShortcut ${LANG_ENGLISH} "Create Desktop Shortcut"
LangString StartMenuShortcut ${LANG_ENGLISH} "Create Start Menu Shortcut"

; Custom installation steps
Section "Associate File Types" SEC_ASSOC
    ; Associate common code file extensions with EchoIDE
    WriteRegStr HKCR ".py" "" "EchoIDE.PythonFile"
    WriteRegStr HKCR ".js" "" "EchoIDE.JavaScriptFile"  
    WriteRegStr HKCR ".ts" "" "EchoIDE.TypeScriptFile"
    WriteRegStr HKCR ".java" "" "EchoIDE.JavaFile"
    WriteRegStr HKCR ".cpp" "" "EchoIDE.CppFile"
    WriteRegStr HKCR ".html" "" "EchoIDE.HtmlFile"
    WriteRegStr HKCR ".css" "" "EchoIDE.CssFile"
    WriteRegStr HKCR ".json" "" "EchoIDE.JsonFile"
    
    ; Create file type descriptions
    WriteRegStr HKCR "EchoIDE.PythonFile" "" "Python Source File"
    WriteRegStr HKCR "EchoIDE.JavaScriptFile" "" "JavaScript Source File"
    WriteRegStr HKCR "EchoIDE.TypeScriptFile" "" "TypeScript Source File"
    WriteRegStr HKCR "EchoIDE.JavaFile" "" "Java Source File"
    WriteRegStr HKCR "EchoIDE.CppFile" "" "C++ Source File"
    WriteRegStr HKCR "EchoIDE.HtmlFile" "" "HTML Document"
    WriteRegStr HKCR "EchoIDE.CssFile" "" "CSS Stylesheet"
    WriteRegStr HKCR "EchoIDE.JsonFile" "" "JSON Document"
SectionEnd

; Uninstaller section
Section "Uninstall"
    ; Remove file associations
    DeleteRegKey HKCR ".py"
    DeleteRegKey HKCR ".js"
    DeleteRegKey HKCR ".ts"
    DeleteRegKey HKCR ".java"
    DeleteRegKey HKCR ".cpp"
    DeleteRegKey HKCR ".html"
    DeleteRegKey HKCR ".css"
    DeleteRegKey HKCR ".json"
    
    DeleteRegKey HKCR "EchoIDE.PythonFile"
    DeleteRegKey HKCR "EchoIDE.JavaScriptFile"
    DeleteRegKey HKCR "EchoIDE.TypeScriptFile"
    DeleteRegKey HKCR "EchoIDE.JavaFile"
    DeleteRegKey HKCR "EchoIDE.CppFile"
    DeleteRegKey HKCR "EchoIDE.HtmlFile"
    DeleteRegKey HKCR "EchoIDE.CssFile"
    DeleteRegKey HKCR "EchoIDE.JsonFile"
SectionEnd
