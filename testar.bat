@echo off
cd /d "%~dp0"

echo Rodando a demonstracao simples do mini FAT...
echo.

set "BUNDLED_PYTHON=C:\Users\faisc\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if exist "%BUNDLED_PYTHON%" (
  "%BUNDLED_PYTHON%" "%~dp0mini_fat.py" demo
  goto fim
)

py "%~dp0mini_fat.py" demo
if %errorlevel% equ 0 goto fim

python "%~dp0mini_fat.py" demo

:fim
echo.
echo Pressione qualquer tecla para fechar.
pause >nul
