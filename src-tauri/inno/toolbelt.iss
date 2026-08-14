; Inno Setup script for the Toolbelt Windows installer.
;
; Built by .github/workflows/release.yml as:
;   ISCC /DAppVersion=1.4.0 /DSourceExe="..\target\release\toolbelt.exe" toolbelt.iss
;
; Locally (from src-tauri/inno, after `npm run build`):
;   & "$env:ProgramFiles(x86)\Inno Setup 6\ISCC.exe" /DAppVersion=0.0.0 toolbelt.iss

#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif
#ifndef SourceExe
  #define SourceExe "..\target\release\toolbelt.exe"
#endif
#ifndef OutDir
  #define OutDir "..\target\release\bundle\inno"
#endif

#define AppName      "Toolbelt"
#define AppExeName   "Toolbelt.exe"
#define AppPublisher "Akin Ozgen"
#define AppUrl       "https://github.com/akinozgen/toolbelt"

[Setup]
AppId={{8F3B1C2A-9D47-4E6B-B0A1-2C5D7E9F4A31}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppUrl}
AppSupportURL={#AppUrl}/issues
AppUpdatesURL={#AppUrl}/releases
VersionInfoVersion={#AppVersion}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
LicenseFile=..\..\LICENSE
OutputDir={#OutDir}
OutputBaseFilename=Toolbelt_{#AppVersion}_x64-setup
SetupIconFile=..\icons\icon.ico
UninstallDisplayIcon={app}\{#AppExeName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
; Per-user install by default, elevate only if the user picks a machine-wide path.
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourceExe}"; DestDir: "{app}"; DestName: "{#AppExeName}"; Flags: ignoreversion
Source: "..\..\LICENSE"; DestDir: "{app}"; DestName: "LICENSE.txt"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
; WebView2 is the rendering engine Tauri relies on; ship the online bootstrapper.
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; \
  StatusMsg: "Installing Microsoft Edge WebView2 Runtime..."; \
  Check: NeedsWebView2; Flags: waituntilterminated skipifdoesntexist
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#AppName}}"; \
  Flags: nowait postinstall skipifsilent

[Code]
const
  WebView2Client = '{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  WebView2Url    = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703';

var
  DownloadPage: TDownloadWizardPage;

function RegHasPv(RootKey: Integer; SubKey: String): Boolean;
var
  Pv: String;
begin
  Result := False;
  if RegQueryStringValue(RootKey, SubKey, 'pv', Pv) then
    Result := (Pv <> '') and (Pv <> '0.0.0.0');
end;

function WebView2Installed: Boolean;
begin
  Result := RegHasPv(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\' + WebView2Client);
  if not Result then
    Result := RegHasPv(HKLM, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\' + WebView2Client);
  if not Result then
    Result := RegHasPv(HKCU, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\' + WebView2Client);
end;

function NeedsWebView2: Boolean;
begin
  Result := not WebView2Installed;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(
    SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), nil);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if (CurPageID = wpReady) and NeedsWebView2 then
  begin
    DownloadPage.Clear;
    DownloadPage.Add(WebView2Url, 'MicrosoftEdgeWebview2Setup.exe', '');
    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
      except
        // Not fatal: the app can still be installed, WebView2 can be added later.
        SuppressibleMsgBox(
          'The WebView2 Runtime could not be downloaded. Toolbelt will be installed, ' +
          'but you may need to install WebView2 manually before it starts.' + #13#10#13#10 +
          AddPeriod(GetExceptionMessage), mbInformation, MB_OK, IDOK);
      end;
    finally
      DownloadPage.Hide;
    end;
  end;
end;
