!macro NSIS_HOOK_PREINSTALL
    # Save user registers to avoid clobbering existing variables
    Push $0
    Push $1
    Push $2

    # Read the uninstall string and install location from the registry
    # Check HKCU (per-user) first
    ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.dhrdev.niyantrak" "UninstallString"
    ReadRegStr $1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.dhrdev.niyantrak" "InstallLocation"

    # Check HKLM (per-machine) if not found in HKCU
    ${If} $0 == ""
        ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.dhrdev.niyantrak" "UninstallString"
        ReadRegStr $1 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.dhrdev.niyantrak" "InstallLocation"
    ${EndIf}

    # If previous installation's uninstaller is found, prompt the user
    ${If} $0 != ""
        MessageBox MB_YESNO|MB_ICONQUESTION "A previous version of NiyanTraK is already installed. Do you want to uninstall it first before proceeding?" IDNO done
        
        # Execute the uninstaller and wait for completion
        # Use the _?=$1 switch if InstallLocation is known to ensure ExecWait blocks until uninstall is complete
        ${If} $1 != ""
            ExecWait '$0 _?=$1' $2
        ${Else}
            ExecWait '$0' $2
        ${EndIf}
    ${EndIf}

done:
    Pop $2
    Pop $1
    Pop $0
!macroend

!macro NSIS_HOOK_POSTINSTALL
!macroend

!macro NSIS_HOOK_PREUNINSTALL
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
!macroend
