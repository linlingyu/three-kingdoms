@echo off

set testUrl=http://www.hosting.com/three-kingdoms/output/open.html
set YUICmprssr=D:\dron\softs\Greens\YUICmprssr\yuicompressor-2.4.2.jar

set crrnt=%~dp0\..
set system=%crrnt%\system
set bin=%system%\bin
set source=%crrnt%\source
set building=%crrnt%\building
set output=%crrnt%\output

if exist "%building%\" (rmdir /s /q "%building%\")
if exist "%output%\" (rmdir /s /q "%output%\")

xcopy "%source%" "%building%\" /h /e /r /y

echo ============================ includer ============================
"%bin%\includer" "%building%\" "%output%\"

rmdir /s /q "%building%\"

if "%1"=="debug" (goto end)

	for /F "usebackq" %%i in (`dir /A-D /S /B "%output%\scripts\*.js"`) do (
		echo compressing... %%i
		java -jar %YUICmprssr% --type js --charset utf-8 -o "%%i" --nomunge "%%i"
	)

	echo.
	echo.

	for /F "usebackq" %%i in (`dir /A-D /S /B "%output%\images\*.css"`) do (
		echo compressing... %%i
		java -jar %YUICmprssr% --type css --charset utf-8 -o "%%i" "%%i"
	)

:end

if "%1"=="debug" (
	"C:\Program Files\Internet Explorer\iexplore.exe" "%testUrl%"
	%system%\build.bat debug
)