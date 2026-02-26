; =============================================================================
; Mac Keyboard Remapping for Synergy (symless.com/synergy)
; AutoHotKey v2 Script
;
; Strategy: Intercept Win (Cmd) key entirely via *LWin hook.
; Track state manually. Map keys via #HotIf context.
; This allows chaining (hold Cmd, press C then V) because
; we never touch the OS Win key state.
; =============================================================================

#Requires AutoHotkey v2.0
#SingleInstance Force
#UseHook true

A_IconTip := "Mac Keyboard (Synergy)"

; =============================================================================
; Manual Win key tracking - the key to making chaining work
; =============================================================================

global g_CmdHeld := false
global g_CmdUsed := false

*LWin::{
    global g_CmdHeld := true
    global g_CmdUsed := false
}

*LWin Up::{
    global g_CmdHeld, g_CmdUsed
    if (!g_CmdUsed && A_PriorKey = "LWin")
        Send "{Blind}{vkE8}"  ; Suppress Start Menu on bare tap
    g_CmdHeld := false
}

Cmd(keys) {
    global g_CmdUsed := true
    SendInput keys
}

; =============================================================================
; Cmd (Win) shortcuts - only active while Cmd/Win is physically held
; =============================================================================

#HotIf g_CmdHeld

; --- Text Editing ---
c::Cmd("^c")                    ; Cmd+C → Copy
v::Cmd("^v")                    ; Cmd+V → Paste
x::Cmd("^x")                    ; Cmd+X → Cut
a::Cmd("^a")                    ; Cmd+A → Select All
z::Cmd("^z")                    ; Cmd+Z → Undo
+z::Cmd("^y")                   ; Cmd+Shift+Z → Redo
s::Cmd("^s")                    ; Cmd+S → Save
+s::Cmd("^+s")                  ; Cmd+Shift+S → Save As
f::Cmd("^f")                    ; Cmd+F → Find
h::Cmd("^h")                    ; Cmd+H → Find & Replace
g::Cmd("^g")                    ; Cmd+G → Go to line

; --- Tab/Window Management ---
t::Cmd("^t")                    ; Cmd+T → New Tab
w::Cmd("^w")                    ; Cmd+W → Close Tab
+t::Cmd("^+t")                  ; Cmd+Shift+T → Reopen Closed Tab
n::Cmd("^n")                    ; Cmd+N → New Window
+n::Cmd("^+n")                  ; Cmd+Shift+N → Incognito/Private Window
q::Cmd("!{F4}")                 ; Cmd+Q → Quit (Alt+F4)

; --- Tab Switching ---
1::Cmd("^1")                    ; Cmd+1-9 → Switch to tab 1-9
2::Cmd("^2")
3::Cmd("^3")
4::Cmd("^4")
5::Cmd("^5")
6::Cmd("^6")
7::Cmd("^7")
8::Cmd("^8")
9::Cmd("^9")

; --- Navigation ---
l::Cmd("^l")                    ; Cmd+L → Address bar / Go to line
r::Cmd("^r")                    ; Cmd+R → Refresh
+r::Cmd("^+r")                  ; Cmd+Shift+R → Hard Refresh
Left::Cmd("{Home}")             ; Cmd+Left → Line start
Right::Cmd("{End}")             ; Cmd+Right → Line end
Up::Cmd("^{Home}")              ; Cmd+Up → Top of document
Down::Cmd("^{End}")             ; Cmd+Down → Bottom of document
Backspace::Cmd("+{Home}{Del}")  ; Cmd+Backspace → Delete to line start

; --- Text Selection ---
+Left::Cmd("+{Home}")           ; Cmd+Shift+Left → Select to line start
+Right::Cmd("+{End}")           ; Cmd+Shift+Right → Select to line end
+Up::Cmd("^+{Home}")            ; Cmd+Shift+Up → Select to doc start
+Down::Cmd("^+{End}")           ; Cmd+Shift+Down → Select to doc end

; --- Dev Tools (VS Code / Cursor) ---
p::Cmd("^p")                    ; Cmd+P → Quick Open
+p::Cmd("^+p")                  ; Cmd+Shift+P → Command Palette
b::Cmd("^b")                    ; Cmd+B → Toggle Sidebar
+b::Cmd("^+b")                  ; Cmd+Shift+B → Build Task
j::Cmd("^j")                    ; Cmd+J → Toggle Terminal Panel
`::Cmd("^``")                   ; Cmd+` → Toggle Terminal
+`::Cmd("^+``")                 ; Cmd+Shift+` → New Terminal
d::Cmd("^d")                    ; Cmd+D → Select Next Occurrence
+d::Cmd("^+d")                  ; Cmd+Shift+D → Debug panel
+e::Cmd("^+e")                  ; Cmd+Shift+E → Explorer panel
+f::Cmd("^+f")                  ; Cmd+Shift+F → Search across files
+g::Cmd("^+g")                  ; Cmd+Shift+G → Source Control
+x::Cmd("^+x")                  ; Cmd+Shift+X → Extensions
,::Cmd("^,")                    ; Cmd+, → Settings
/::Cmd("^/")                    ; Cmd+/ → Toggle Comment

; --- Formatting ---
i::Cmd("^i")                    ; Cmd+I → Italic
+l::Cmd("^+l")                  ; Cmd+Shift+L → Select all occurrences

; --- Raycast ---
Space::Cmd("!{Space}")          ; Cmd+Space → Raycast (Alt+Space)

; --- Screenshot ---
+3::Cmd("#+s")                  ; Cmd+Shift+3 → Snipping Tool
+4::Cmd("#+s")                  ; Cmd+Shift+4 → Snipping Tool
+5::Cmd("#+s")                  ; Cmd+Shift+5 → Snipping Tool

; --- Lock Screen ---
^q::DllCall("LockWorkStation")  ; Cmd+Ctrl+Q → Lock

; --- Window switching ---
Tab::Cmd("!{Tab}")              ; Cmd+Tab → Alt+Tab

#HotIf

; =============================================================================
; Option (Alt) shortcuts - these work fine without manual tracking
; =============================================================================

!Left::Send "^{Left}"           ; Option+Left → Word jump left
!Right::Send "^{Right}"         ; Option+Right → Word jump right
!Backspace::Send "^{Backspace}" ; Option+Backspace → Delete word backward
!+Left::Send "^+{Left}"         ; Option+Shift+Left → Select word left
!+Right::Send "^+{Right}"       ; Option+Shift+Right → Select word right

; =============================================================================
; Media Keys (uncomment if Synergy doesn't pass these through)
; =============================================================================

; #HotIf g_CmdHeld
; F7::Cmd("{Media_Prev}")
; F8::Cmd("{Media_Play_Pause}")
; F9::Cmd("{Media_Next}")
; F10::Cmd("{Volume_Mute}")
; F11::Cmd("{Volume_Down}")
; F12::Cmd("{Volume_Up}")
; #HotIf

; =============================================================================
; Tray Menu
; =============================================================================

TrayMenu := A_TrayMenu
TrayMenu.Delete()
TrayMenu.Add("Mac Keyboard (Synergy)", (*) => 0)
TrayMenu.Disable("Mac Keyboard (Synergy)")
TrayMenu.Add()
TrayMenu.Add("Reload", (*) => Reload())
TrayMenu.Add("Suspend", (*) => (Suspend(), A_IsSuspended ? TrayMenu.Check("Suspend") : TrayMenu.Uncheck("Suspend")))
TrayMenu.Add()
TrayMenu.Add("Exit", (*) => ExitApp())
