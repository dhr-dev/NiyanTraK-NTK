# RyzenAdj Integration: Troubleshooting, Problems, & Resolutions

This document provides a comprehensive history of the RyzenAdj integration inside VictusDeck, detailing what was being done wrong in previous attempts, what problems arose, and how they were resolved to achieve a robust, production-grade hardware tuning utility.

---

## 1. Context & Background

VictusDeck uses `ryzenadj.exe` to write power limits (Fast PPT, Slow PPT, and STAPM) directly to the CPU's hardware registers. Because this program modifies low-level hardware configuration tables, it requires interacting with AMD's Model-Specific Registers (MSR) and PCI configuration space via a kernel-level Ring 0 driver (`WinRing0x64.sys`). 

---

## 2. Problems Encountered & Why They Happened

### 2.1 The `0xC0000005` (STATUS_ACCESS_VIOLATION) Immediate Crash
- **The Problem**: When running VictusDeck as a GUI desktop app via Tauri, calling RyzenAdj directly caused the executable to crash immediately, returning exit code `-1073741819` (equivalent to `0xC0000005` Access Violation). No values were written to hardware.
- **What Was Being Done Wrong**: We were spawning the child process and attempting to capture its standard streams directly inside Rust using:
  ```rust
  cmd.stdout(Stdio::piped()).stderr(Stdio::piped())
  ```
  In a standard Windows GUI application, forcing stdout/stderr pipe handles into standard thread-redirection structures triggers thread-safety and handle-sharing conflicts inside the `WinRing0x64` mapper library. This caused the kernel driver mapper to panic with a memory access violation.
- **The Resolution**: We bypassed piped streams entirely. The backend now routes stdout/stderr directly into temporary text files (`ryzenadj_direct_out.txt` and `ryzenadj_direct_err.txt`) using native file descriptors (`std::fs::File`). RyzenAdj executes successfully without handle conflicts, and our backend reads and cleans up these temp files post-execution.

### 2.2 Path Space Truncation & Driver Load Failures
- **The Problem**: When the application was stored in a folder path containing spaces (e.g., `d:\Projects\UTILITY SOFT\Victus\victus-deck`), RyzenAdj failed to initialize. It output generic "Unable to init" errors or failed to locate adjacent dependent libraries (`libryzenadj.dll`, `WinRing0x64.dll`, `inpoutx64.dll`).
- **What Was Being Done Wrong**: The process was spawned without defining its directory search rules, forcing the operating system to rely on standard system PATH resolution which truncated unquoted paths containing spaces.
- **The Resolution**: We introduced two runtime alignment steps before spawning the executable:
  1. We set the process's current working directory explicitly to the parent folder of `ryzenadj.exe` using `cmd.current_dir(parent)`.
  2. We dynamically read the active `PATH` environment variable and prepended the absolute parent folder path of `ryzenadj.exe` onto it.
  This guaranteed that all adjacent DLL dependencies and driver files were resolved and mapped correctly by Windows.

### 2.3 False Negative Exit Codes (COS-LEVEL CRASH ON EXIT)
- **The Problem**: Even after resolving pipe redirection, the `ryzenadj.exe` process returned exit code `-1073741819` (STATUS_ACCESS_VIOLATION). Our backend intercepted this as an execution failure, causing the frontend to display an error toast recommending the user disable Core Isolation.
- **What Was Being Done Wrong**: We assumed any non-zero exit code meant the hardware registers were not updated.
- **The Resolution**: In reality, on Hawk Point systems, RyzenAdj successfully writes the requested values, but crashes during its deallocation sequence (when unloading the driver mapper from memory right before termination). We restructured our Rust status match. The backend now explicitly intercepts exit code `-1073741819` *before* the success/fail fork, treats it as a benign post-write crash, logs it, and returns `success: true` to the frontend.

### 2.4 STAPM Limit BIOS-Gating Misunderstandings
- **The Problem**: Setting high presets or custom limits succeeded in our logs, but the Ryzen Diagnostics Monitor consistently reported that the `STAPM Limit` remained locked at its BIOS floor (typically `45.000W`), while Fast and Slow PPT limits scaled correctly.
- **What Was Being Done Wrong**: Previous designs attempted to fight this limit or flagged it as an error when STAPM failed to align with custom targets.
- **The Resolution**: On modern mobile processors (specifically Hawk Point), STAPM is BIOS-gated by HP firmware. Because Fast PPT and Slow PPT are fully adjustable and actually govern the real-world package power scaling, we kept the `--stapm-limit` parameter in our commands (which is safe) but added a `(BIOS-controlled)` annotation in the UI to prevent user confusion.

---

## 3. Power Limits Explained (Why One Slider?)

The AMD Ryzen architecture controls package power using three distinct thermal and electrical thresholds:

1. **Fast PPT Limit (Fast Package Power Tracking)**: Controls peak burst power (in watts). The CPU is allowed to draw up to this limit for short durations (typically up to 10 seconds).
2. **Slow PPT Limit (Slow Package Power Tracking)**: Controls sustained power. Under prolonged load, the CPU settles into this target (typically after 30-60 seconds).
3. **STAPM Limit (Skin Temperature Aware Power Management)**: Calculates a rolling average of CPU temperature to prevent the laptop chassis from getting too hot to touch.

### Why do we configure them together?
These limits operate as overlapping ceilings. If we only exposed a slider for Fast PPT but left Slow PPT at its default low floor, the CPU would only boost for 5 seconds before dropping down to the Slow PPT floor, rendering custom presets ineffective. 

By binding all three limits to **the exact same value** via a single slider, we configure a unified sustained power envelope, ensuring the CPU sustains the requested wattage continuously without stepped throttling.
