; =============================================================================
; Mac Keyboard Remapping for Synergy (symless.com/synergy)
; AutoHotKey v2 Script
;
; Makes a Mac keyboard feel native on Windows when shared via Synergy.
; Synergy sends Mac keys as: Cmd→Win, Option→Alt (by default)
;
; This script intercepts Win key combos and translates them to
; the Ctrl-based equivalents Windows expects.
; =============================================================================

#Requires AutoHotkey v2.0
#SingleInstance Force

; Tray icon tooltip
A_IconTip := "Mac Keyboard (Synergy)"

; =============================================================================
; Core Remapping: Cmd (Win key) → Ctrl for standard shortcuts
; =============================================================================

; --- Text Editing (most used) ---
#c::Send "^c"           ; Cmd+C → Copy
#v::Send "^v"           ; Cmd+V → Paste
#x::Send "^x"           ; Cmd+X → Cut
#a::Send "^a"           ; Cmd+A → Select All
#z::Send "^z"           ; Cmd+Z → Undo
#+z::Send "^y"          ; Cmd+Shift+Z → Redo
#s::Send "^s"           ; Cmd+S → Save
#+s::Send "^+s"         ; Cmd+Shift+S → Save As
#f::Send "^f"           ; Cmd+F → Find
#h::Send "^h"           ; Cmd+H → Find & Replace (not Hide)
#g::Send "^g"           ; Cmd+G → Go to line

; --- Tab/Window Management ---
#t::Send "^t"           ; Cmd+T → New Tab
#w::Send "^w"           ; Cmd+W → Close Tab
#+t::Send "^+t"         ; Cmd+Shift+T → Reopen Closed Tab
#n::Send "^n"           ; Cmd+N → New Window
#+n::Send "^+n"         ; Cmd+Shift+N → New Incognito/Private Window
#q::Send "!{F4}"        ; Cmd+Q → Quit Application (Alt+F4)

; --- Tab Switching ---
#1::Send "^1"           ; Cmd+1-9 → Switch to tab 1-9
#2::Send "^2"
#3::Send "^3"
#4::Send "^4"
#5::Send "^5"
#6::Send "^6"
#7::Send "^7"
#8::Send "^8"
#9::Send "^9"

; --- Navigation ---
#l::Send "^l"           ; Cmd+L → Address bar / Go to line
#r::Send "^r"           ; Cmd+R → Refresh
#+r::Send "^+r"         ; Cmd+Shift+R → Hard Refresh
#Left::Send "{Home}"    ; Cmd+Left → Home (line start)
#Right::Send "{End}"    ; Cmd+Right → End (line end)
#Up::Send "^{Home}"     ; Cmd+Up → Top of document
#Down::Send "^{End}"    ; Cmd+Down → Bottom of document
#Backspace::Send "+{Home}{Del}" ; Cmd+Backspace → Delete to line start

; --- Text Selection with Cmd ---
#+Left::Send "+{Home}"  ; Cmd+Shift+Left → Select to line start
#+Right::Send "+{End}"  ; Cmd+Shift+Right → Select to line end
#+Up::Send "^+{Home}"   ; Cmd+Shift+Up → Select to document start
#+Down::Send "^+{End}"  ; Cmd+Shift+Down → Select to document end

; --- Option (Alt) key word navigation ---
; Option+Left/Right → Ctrl+Left/Right (word jump)
!Left::Send "^{Left}"
!Right::Send "^{Right}"
!Backspace::Send "^{Backspace}" ; Option+Backspace → Delete word backward

; --- Option+Shift word selection ---
!+Left::Send "^+{Left}"        ; Option+Shift+Left → Select word left
!+Right::Send "^+{Right}"      ; Option+Shift+Right → Select word right

; --- Dev Tools ---
#p::Send "^p"           ; Cmd+P → Quick Open / Command Palette prefix
#+p::Send "^+p"         ; Cmd+Shift+P → Command Palette (VS Code, Cursor)
#b::Send "^b"           ; Cmd+B → Toggle Sidebar
#+b::Send "^+b"         ; Cmd+Shift+B → Build Task
#j::Send "^j"           ; Cmd+J → Toggle Terminal Panel
#`::Send "^``"          ; Cmd+` → Toggle Terminal (VS Code)
#+`::Send "^+``"        ; Cmd+Shift+` → New Terminal
#d::Send "^d"           ; Cmd+D → Select Next Occurrence
#+d::Send "^+d"         ; Cmd+Shift+D → Debug panel
#+e::Send "^+e"         ; Cmd+Shift+E → Explorer panel
#+f::Send "^+f"         ; Cmd+Shift+F → Search across files
#+g::Send "^+g"         ; Cmd+Shift+G → Source Control panel
#+x::Send "^+x"         ; Cmd+Shift+X → Extensions panel
#,::Send "^,"           ; Cmd+, → Settings
#/::Send "^/"           ; Cmd+/ → Toggle Comment

; --- Formatting ---
#i::Send "^i"           ; Cmd+I → Italic (or Info)
#+l::Send "^+l"         ; Cmd+Shift+L → Select all occurrences

; =============================================================================
; Cmd+Tab → Alt+Tab (Window Switching)
; =============================================================================

; This is tricky because Win+Tab opens Task View on Windows.
; We intercept and send Alt+Tab instead.
#Tab::AltTab
#+Tab::ShiftAltTab

; =============================================================================
; Cmd+` → Switch Windows of Same App (macOS-like)
; =============================================================================

; Windows has no native equivalent. This cycles through windows of the
; currently focused application using Alt+Escape filtered by process.

; Note: This is a best-effort approximation. For a more robust solution,
; consider using PowerToys or a dedicated window manager.

; =============================================================================
; Cmd+Space → Open Raycast (same as macOS)
; =============================================================================

; Raycast on Windows uses Alt+Space by default.
; This maps Cmd+Space (which Synergy sends as Win+Space) to Raycast's trigger.
#Space::Send "!{Space}"

; =============================================================================
; Media Keys (pass through - Synergy usually handles these)
; =============================================================================

; Uncomment if Synergy doesn't handle media keys:
; #F7::Send "{Media_Prev}"
; #F8::Send "{Media_Play_Pause}"
; #F9::Send "{Media_Next}"
; #F10::Send "{Volume_Mute}"
; #F11::Send "{Volume_Down}"
; #F12::Send "{Volume_Up}"

; =============================================================================
; Lock Screen: Cmd+Ctrl+Q → Win+L
; =============================================================================

^#q::DllCall("LockWorkStation")

; =============================================================================
; Screenshot: Cmd+Shift+3/4/5 → Snipping Tool
; =============================================================================

#+3::Send "#+s"         ; Cmd+Shift+3 → Windows Snip (Win+Shift+S)
#+4::Send "#+s"         ; Cmd+Shift+4 → Windows Snip
#+5::Send "#+s"         ; Cmd+Shift+5 → Windows Snip

; =============================================================================
; Disable accidental Win key single-press (Start Menu)
; =============================================================================

; The Win key alone opens Start Menu. When using Cmd as a modifier,
; releasing Cmd before the other key sometimes triggers Start Menu.
; This suppresses that behavior.

~LWin Up::
{
    ; Only suppress if Win was pressed very briefly (likely a modifier release)
    if (A_PriorKey = "LWin" && A_TimeSincePriorHotkey < 200)
        Send "{Blind}{vkE8}"  ; Send a dummy key to suppress Start Menu
}

; =============================================================================
; Tray Menu
; =============================================================================

A_TrayMenu := TrayMenu := A_TrayMenu
TrayMenu.Delete()
TrayMenu.Add("Mac Keyboard (Synergy)", (*) => 0)
TrayMenu.Disable("Mac Keyboard (Synergy)")
TrayMenu.Add()
TrayMenu.Add("Reload", (*) => Reload())
TrayMenu.Add("Suspend", (*) => (Suspend(), A_IsSuspended ? TrayMenu.Check("Suspend") : TrayMenu.Uncheck("Suspend")))
TrayMenu.Add()
TrayMenu.Add("Exit", (*) => ExitApp())
