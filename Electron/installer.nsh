!include "WordFunc.nsh"

!macro customInit
  ; Read the currently installed version from the registry
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion"
  StrCmp $0 "" done
  
  ; Compare installed version ($0) with this installer's version (${VERSION})
  ${VersionCompare} $0 ${VERSION} $1
  IntCmp $1 0 equal newer older
  
  equal:
    MessageBox MB_OK "FederiGene is already up to date (Version ${VERSION})."
    Quit
    
  newer:
    MessageBox MB_OK "A higher version of FederiGene ($0) is already installed. You cannot install this lower version (${VERSION})."
    Quit
    
  older:
    ; Normal installation proceeds
  done:
!macroend
