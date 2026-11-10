; Carries an install made under the old publisher name over to the new one, on the update that first meets it.
!include LogicLib.nsh

; The registry paths are spelled out: this file is included before the installer defines its own names.
!define KARASU_OLD_KEY "Software\Kyu\Karasu"
!define KARASU_NEW_KEY "Software\Kyusetzu\Karasu"

Var KarasuAdopted

; Takes the old key's install folder and language when the new key holds none, and installs where the app already is.
!macro KARASU_ADOPT_OLD_PUBLISHER
  StrCpy $KarasuAdopted 0
  Push $R8
  Push $R9
  ReadRegStr $R8 SHCTX "${KARASU_NEW_KEY}" ""
  ReadRegStr $R9 SHCTX "${KARASU_OLD_KEY}" ""
  ${If} $R8 == ""
  ${AndIf} $R9 != ""
    WriteRegStr SHCTX "${KARASU_NEW_KEY}" "" $R9
    ReadRegStr $R8 HKCU "${KARASU_OLD_KEY}" "Installer Language"
    ${If} $R8 != ""
      WriteRegStr HKCU "${KARASU_NEW_KEY}" "Installer Language" $R8
    ${EndIf}
    ; A folder named on the command line stays the caller's choice.
    ${If} $INSTDIR == "$LOCALAPPDATA\Karasu"
    ${AndIf} $R9 != $INSTDIR
      StrCpy $INSTDIR $R9
      StrCpy $KarasuAdopted 1
    ${EndIf}
  ${EndIf}
  Pop $R9
  Pop $R8
!macroend

; Runs before the first page, so the folder page and the update both start from the old install.
Function KarasuAdoptOldPublisher
  !insertmacro KARASU_ADOPT_OLD_PUBLISHER
FunctionEnd
!define MUI_CUSTOMFUNCTION_GUIINIT KarasuAdoptOldPublisher

; A silent install shows no window and so never ran the function above; it adopts here, and leaves no empty folder.
!macro NSIS_HOOK_PREINSTALL
  !insertmacro KARASU_ADOPT_OLD_PUBLISHER
  ${If} $KarasuAdopted = 1
    SetOutPath $INSTDIR
    RMDir "$LOCALAPPDATA\Karasu"
  ${EndIf}
!macroend

; The install is in place under the new name, so the old key has nothing left to say.
!macro NSIS_HOOK_POSTINSTALL
  DeleteRegKey SHCTX "${KARASU_OLD_KEY}"
  DeleteRegKey HKCU "${KARASU_OLD_KEY}"
  DeleteRegKey /ifempty SHCTX "Software\Kyu"
  DeleteRegKey /ifempty HKCU "Software\Kyu"
!macroend
