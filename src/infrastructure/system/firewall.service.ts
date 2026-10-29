import { exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export class FirewallService {
  public static async allowPort(port: number = 4000): Promise<{ success: boolean; message: string }> {
    if (process.platform !== 'win32') {
      return { success: true, message: 'Configuración solo aplicable a Windows.' };
    }

    return new Promise((resolve) => {
      const tempBatPath = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'rd_firewall_setup.bat');
      const batContent = `@echo off
netsh advfirewall firewall delete rule name="RD POS (Puerto ${port})" >nul 2>&1
netsh advfirewall firewall add rule name="RD POS (Puerto ${port})" dir=in action=allow protocol=TCP localport=${port} profile=any >nul
if exist "%LOCALAPPDATA%\\rd\\rd.exe" (
  netsh advfirewall firewall delete rule name="RD POS (AppData rd.exe)" >nul 2>&1
  netsh advfirewall firewall add rule name="RD POS (AppData rd.exe)" dir=in action=allow program="%LOCALAPPDATA%\\rd\\rd.exe" profile=any >nul
)
for /d %%D in ("%LOCALAPPDATA%\\rd\\app-*") do (
  if exist "%%D\\rd.exe" (
    netsh advfirewall firewall delete rule name="RD POS (%%~nxD)" >nul 2>&1
    netsh advfirewall firewall add rule name="RD POS (%%~nxD)" dir=in action=allow program="%%D\\rd.exe" profile=any >nul
  )
)
`;

      try {
        fs.writeFileSync(tempBatPath, batContent, 'utf-8');
      } catch (err: any) {
        return resolve({ success: false, message: `Error al crear script temporal: ${err.message}` });
      }

      const psCmd = `Start-Process cmd.exe -Verb RunAs -Wait -ArgumentList '/c ""${tempBatPath}""'`;
      exec(`powershell.exe -NoProfile -Command "${psCmd}"`, (error) => {
        if (error) {
          resolve({ success: false, message: `Error ejecutando elevación: ${error.message}` });
        } else {
          resolve({ success: true, message: `Reglas de firewall creadas para ejecutables y puerto ${port}.` });
        }
      });
    });
  }
}
