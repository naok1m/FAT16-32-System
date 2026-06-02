@echo off
cd /d "%~dp0"

echo Abrindo o modo manual do mini FAT...
echo.

set "BUNDLED_PYTHON=C:\Users\faisc\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if exist "%BUNDLED_PYTHON%" (
  "%BUNDLED_PYTHON%" "%~dp0mini_fat.py" menu
  goto fim
)

py "%~dp0mini_fat.py" menu
if %errorlevel% equ 0 goto fim

python "%~dp0mini_fat.py" menu

:fim
echo.
echo Pressione qualquer tecla para fechar.
pause >nul
