sc stop PEService
sc stop StreamerService

taskkill /F /IM pe.exe
taskkill /F /IM streamerservice.exe

ping -n 1 10.7.75.1 -w 500

if not errorlevel 1 (

start "C:\Program Files\Qube Cinema\XP" plink.exe root@10.7.75.1 -pw blah "/usr/local/bin/flushlogs /tmp/ 1"
timeout /t 40
taskkill /F /IM plink.exe
echo yes | "C:\Program Files\Qube Cinema\XP\pscp.exe" -pw blah root@10.7.75.1:/tmp/*.tar.gz D:\QubeConfig\
echo yes | "C:\Program Files\Qube Cinema\XP\plink.exe" -pw blah -m "C:\Program Files\Qube Cinema\XP\Reset.sh" root@10.7.75.1
)

ping -n 1 10.8.75.1 -w 500

if not errorlevel 1 (

start "C:\Program Files\Qube Cinema\XP" plink.exe root@10.8.75.1 -pw blah "/usr/local/bin/flushlogs /tmp/ 1"
timeout /t 40
taskkill /F /IM plink.exe
echo yes | "C:\Program Files\Qube Cinema\XP\pscp.exe" -pw blah root@10.8.75.1:/tmp/*.tar.gz D:\QubeConfig\
echo yes | "C:\Program Files\Qube Cinema\XP\plink.exe" -pw blah -m "C:\Program Files\Qube Cinema\XP\Reset.sh" root@10.8.75.1

)

sc start PEService

