# Avanzamenti

- Analizzata la web app ASP.NET (pagine e script) e mappati i servizi .asmx e le chiamate ai metodi dai file JS.
- Decompilati i servizi da `Mama.dll` e salvati i sorgenti in `_decompiled/`:
  - `Qube_Mama_Catalog.cs`
  - `Qube_Mama_Dalapathi.cs`
  - `Qube_Mama_LogService.cs`
  - `Qube_Mama_Maintenance.cs`
  - `Qube_Mama_Setup.cs`
  - `Qube_Mama_Usher.cs`
- Decompilati elementi di QubeStore per i percorsi di storage:
  - `_decompiled/QubeStore_Store_QubeStoreFolder.cs`
  - `_decompiled/QubeStore_QubeStoreFolderType.cs`
- Verificata la persistenza degli show: salvataggio in DB e generazione SPL tramite `IDCPEntityServiceProvider`.
- Installato `ilspycmd` come tool locale in `_tools/` per la decompilazione.

## Note
- Non sono presenti sorgenti .sln/.csproj nel workspace.
- La configurazione DB è in `XP/Mama/Web.config` (database `Qube` su SQL Express).
