@echo off

set crrnt=%~dp0\..
set source=%crrnt%\source
set editplus=D:\EditPlus 3\editplus.exe

start "" "%editplus%"

for %%j in (html,css,js) do (
	for /F "usebackq delims=" %%i in (`dir /A-D /S /B "%source%\*.%%j"`) do (
		echo openning %%i
		ping 127.0.0.1 -n 1 -w 1000 > nul
		start "" "%editplus%" "%%i"
	)
)