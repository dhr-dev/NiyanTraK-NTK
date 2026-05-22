# RyzenAdj Hardware Interface & Architecture Research

This document outlines the low-level architecture, operation, and future enhancement paths for the CPU tuning interface inside VictusDeck. It details how the app integrates with `ryzenadj.exe`, the inner mechanics of Ring 0 driver access, and programmatic alternatives (FFI vs. direct driver communication).

---

## 1. Current Implementation: How VictusDeck Uses RyzenAdj

VictusDeck currently utilizes the **pre-compiled `ryzenadj.exe` CLI binary** rather than linking directly to its source DLLs via FFI. 

### Spawning Strategy
In `src-tauri/src/core/ryzen_adj.rs`, the Tauri Rust backend locates the executable and spawns it as a subprocess using `std::process::Command`. 

1. **Locating the Executable**:
   - It checks the absolute dev resource path first: `src-tauri\resources\ryzenadj-win64\ryzenadj.exe`
   - It falls back to `./bin/ryzenadj.exe`
   - It falls back to the system environment `PATH` (`ryzenadj`)

2. **Process Execution & Pipe Workaround**:
   - Spawning RyzenAdj inside Tauri directly with piped standard streams (`Stdio::piped()`) causes immediate Thread-Safety conflicts inside the underlying mapping library, triggering a `0xC0000005` (Access Violation) crash before parameters are applied.
   - To bypass this, the app redirects stdout and stderr directly into temporary text files on the disk (`ryzenadj_direct_out.txt` and `ryzenadj_direct_err.txt`) using native file descriptors (`std::fs::File`). The backend reads the result from these files and deletes them immediately after execution.

---

## 2. Low-Level Mechanics: What RyzenAdj & WinRing0 Actually Do

To control hardware behaviors, RyzenAdj must bypass standard operating system safety boundaries to speak directly with the AMD System Management Unit (SMU).

### 2.1 The Security Barrier: User Space (Ring 3) vs. Kernel Space (Ring 0)
* **User Space (Ring 3)**: Where Tauri, Rust, and all standard desktop applications run. The CPU strictly blocks Ring 3 code from accessing raw hardware registers, physical memory addresses, or PCI configurations.
* **Kernel Space (Ring 0)**: Unrestricted physical memory and hardware register access. Operating system kernels and drivers execute at this level.

### 2.2 The WinRing0 Driver Bridge
Because writing a custom kernel driver is extremely complex and requires a Microsoft driver signature, RyzenAdj utilizes the **WinRing0** driver framework:
* **`WinRing0x64.sys`**: A generic, pre-signed Kernel Space (Ring 0) driver. Because it is signed by a valid authority, Windows permits it to load into the kernel.
* **`WinRing0x64.dll`**: A User Space (Ring 3) dynamic library wrapper.
* **The Bridge**: When `ryzenadj` wants to modify a hardware register, it makes an API call to `WinRing0x64.dll`. The DLL executes a Windows **IOCTL (Input/Output Control)** system call. The Windows kernel forwards this request to the loaded `WinRing0x64.sys` driver, which executes the physical memory read/write at Ring 0 and passes the resulting data back up to the DLL.

### 2.3 The SMU (System Management Unit) Mailbox Handshake
Once `ryzenadj` has the ability to read and write physical memory via WinRing0, it communicates directly with the **AMD SMU**. The SMU is a dedicated, independent microcontroller inside AMD APUs that governs power, thermal thresholds, and boost behavior.

Since AMD does not publish public specifications for the SMU registers, RyzenAdj uses a reverse-engineered **Mailbox Protocol** (typically mapped to memory-mapped registers (MMIO) around the `0xFED80000` region):
1. **Load Arguments**: Writes the desired limit value (e.g. `35000` mW for 35W) into the SMU argument registers (`SMU_MSG_ARG`).
2. **Set Message ID**: Writes a generation-specific message ID (e.g., Cezanne vs. Hawk Point command indices) into the SMU command register (`SMU_MSG_CMD`).
3. **Trigger Handshake**: Sets a hardware bit telling the SMU co-processor that a new command is waiting in the mailbox.
4. **Poll Success**: Loops, reading the response register (`SMU_MSG_RESP`) until the SMU co-processor completes the command and returns a success signature (typically `0x1`).

---

## 3. Future Architectural Enhancements: Analysis of Options

If VictusDeck moves away from spawning the compiled `ryzenadj.exe` CLI, there are two primary paths for deep system integration.

### Option A: Dynamic Library Loading (`libryzenadj.dll`) via Rust FFI (Recommended)
Instead of executing a subprocess, the Tauri Rust backend could load `libryzenadj.dll` dynamically at runtime using a crate like `libloading` and call its exposed C-interfaces directly.

* **Pros**:
  * **No CLI Text Parsing**: Completely eliminates regex-based parsing of stdout tables (e.g., from `ryzenadj --info`). We can call getter functions to fetch clean, structured numeric limits directly.
  * **No Temporary File Workarounds**: Removes the disk I/O redirection workaround we wrote to prevent `0xC0000005` CLI pipe crashes.
  * **Sub-millisecond Performance**: Speeds up limit adjustments and status queries by eliminating the overhead of launching external processes.
* **Cons & Risks**:
  * **Global Process Crashes**: A memory violation or Null Pointer Exception inside a DLL loaded via Rust FFI (e.g., `libryzenadj.dll` crashing on deallocation) **will instantly terminate the entire Tauri GUI app**. In contrast, a crash in `ryzenadj.exe` only returns a standard exit code which can be handled gracefully in Rust.
  * **Licensing**: `ryzenadj` is licensed under GPLv3. While dynamic linking is generally safe, licensing obligations must be reviewed.

### Option B: Pure Rust Re-implementation using `WinRing0` Directly
We write a custom AMD SMU mailbox interface completely in Rust and interact directly with the `WinRing0` driver, bypassing the RyzenAdj codebase entirely.

* **Pros**:
  * **Zero External Dependencies**: Eliminates all `ryzenadj` files and dependencies, creating an extremely lightweight system utility.
* **Cons & Risks**:
  * **Extreme Reverse-Engineering Burden**: AMD's SMU registers, memory locations, and mailbox IDs change with virtually **every single APU architecture** (Renoir, Cezanne, Rembrandt, Phoenix, Hawk Point, Strix Point). Maintaining support for multiple CPU generations requires an immense engineering effort.
  * **Hardware Risk**: Incorrectly writing to undocumented SMU registers carries a serious risk of soft-bricking user motherboards or causing thermal damage.
  * **Driver Signing**: We would still have to bundle and load the third-party `WinRing0x64.sys` binary because Windows requires a digitally signed kernel-level driver to interface with physical CPU addresses.

---

## 4. Resource Dependency Map
For reference, here is how the RyzenAdj files function together inside the directory:
* `ryzenadj.exe`: A lightweight CLI wrapper that takes flags and calls the dynamic library.
* `libryzenadj.dll`: The primary engine containing CPU-generation tables, register offsets, and mailbox command procedures.
* `WinRing0x64.dll`: The user-mode interface wrapper for IOCTL system calls.
* `WinRing0x64.sys`: The pre-signed Ring 0 Kernel Driver that executes raw CPU/PCI read and write commands.
* `inpoutx64.dll`: Legacy alternative/fallback I/O port mapping library.
