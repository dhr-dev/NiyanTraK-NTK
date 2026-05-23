use std::process::Command;
use std::path::{Path, PathBuf};
use serde_json::json;
use std::sync::{Mutex, OnceLock};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct RyzenAdjResponse {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

fn find_ryzenadj_exe() -> PathBuf {
    // 1. Resolve relative to the current running executable (works in production installations)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let prod_path = exe_dir.join("resources").join("ryzenadj-win64").join("ryzenadj.exe");
            if prod_path.exists() {
                return prod_path;
            }
        }
    }

    // 2. Fallback: check current working directory resources directory (standard for tauri dev and cargo runs)
    let dev_path = Path::new("resources").join("ryzenadj-win64").join("ryzenadj.exe");
    if dev_path.exists() {
        return dev_path;
    }

    // 3. Fallback: check relative ./bin directory
    let local_bin = Path::new("bin").join("ryzenadj.exe");
    if local_bin.exists() {
        local_bin
    } else {
        // 4. Default to system PATH
        PathBuf::from("ryzenadj")
    }
}

fn ryzenadj_mutex() -> &'static Mutex<()> {
    static MUTEX: OnceLock<Mutex<()>> = OnceLock::new();
    MUTEX.get_or_init(|| Mutex::new(()))
}

/*
fn execute_ryzenadj_via_file_redirection(exe: &Path, args: &[&str]) -> std::io::Result<std::process::Output> {
    let parent = exe.parent().ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Parent directory not found"))?;
    
    let temp_dir = std::env::temp_dir();
    let out_file = temp_dir.join("ryzenadj_out.txt");
    let err_file = temp_dir.join("ryzenadj_err.txt");
    
    // Clean up old files
    let _ = std::fs::remove_file(&out_file);
    let _ = std::fs::remove_file(&err_file);

    let mut cmd = Command::new("cmd");
    cmd.arg("/c");

    let out_path_str = out_file.to_string_lossy();
    let err_path_str = err_file.to_string_lossy();
    let command_string = format!("ryzenadj.exe {} > \"{}\" 2> \"{}\"", args.join(" "), out_path_str, err_path_str);
    cmd.arg(&command_string);
    cmd.current_dir(parent);

    // Spawn and wait for the CMD process to finish (which spawns ryzenadj)
    let status = cmd.status()?;
    
    // Read the output from the temporary files
    let stdout = std::fs::read_to_string(&out_file).unwrap_or_default();
    let stderr = std::fs::read_to_string(&err_file).unwrap_or_default();

    // Clean up
    let _ = std::fs::remove_file(&out_file);
    let _ = std::fs::remove_file(&err_file);

    use std::os::windows::process::ExitStatusExt;
    let exit_code = status.code().unwrap_or(-1);
    let os_status = std::process::ExitStatus::from_raw(exit_code as u32);

    Ok(std::process::Output {
        status: os_status,
        stdout: stdout.into_bytes(),
        stderr: stderr.into_bytes(),
    })
}
*/

fn execute_ryzenadj_direct(exe: &Path, args: &[&str]) -> std::io::Result<std::process::Output> {
    let parent = exe.parent().ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Parent directory not found"))?;
    
    // Ensure PATH has ryzenadj parent directory prepended for DLL loading
    let path_env = std::env::var_os("PATH").unwrap_or_default();
    let new_path = if path_env.is_empty() {
        parent.to_path_buf().into_os_string()
    } else {
        let mut paths = std::env::split_paths(&path_env).collect::<Vec<_>>();
        paths.insert(0, parent.to_path_buf());
        std::env::join_paths(paths).unwrap_or_else(|_| path_env.clone())
    };

    // Log debugging details
    println!("[RyzenAdj Debug] --- Execution Details ---");
    println!("[RyzenAdj Debug] Full EXE Path: {:?}", exe);
    println!("[RyzenAdj Debug] Working Directory: {:?}", parent);
    println!("[RyzenAdj Debug] Arguments: {:?}", args);
    println!("[RyzenAdj Debug] Prepend PATH: {:?}", new_path);

    // Setup direct temporary redirection files to avoid console pipe NULL anomalies
    let temp_dir = std::env::temp_dir();
    let out_file_path = temp_dir.join("ryzenadj_direct_out.txt");
    let err_file_path = temp_dir.join("ryzenadj_direct_err.txt");

    // Clean up old files
    let _ = std::fs::remove_file(&out_file_path);
    let _ = std::fs::remove_file(&err_file_path);

    let out_file = std::fs::File::create(&out_file_path)?;
    let err_file = std::fs::File::create(&err_file_path)?;

    let mut cmd = Command::new(exe);
    cmd.args(args);
    cmd.current_dir(parent);
    cmd.env("PATH", &new_path);
    cmd.stdout(out_file);
    cmd.stderr(err_file);

    #[cfg(windows)]
    cmd.creation_flags(0x08000000);

    let status = cmd.status()?;

    // Read the output from the temporary files
    let stdout = std::fs::read_to_string(&out_file_path).unwrap_or_default();
    let stderr = std::fs::read_to_string(&err_file_path).unwrap_or_default();

    // Clean up
    let _ = std::fs::remove_file(&out_file_path);
    let _ = std::fs::remove_file(&err_file_path);

    let exit_code = status.code().unwrap_or(-1);
    
    println!("[RyzenAdj Debug] Exit Code: {}", exit_code);
    println!("[RyzenAdj Debug] Stdout: {}", stdout.trim());
    println!("[RyzenAdj Debug] Stderr: {}", stderr.trim());
    
    if exit_code == -1073741819 || exit_code as u32 == 0xC0000005 {
        println!("[RyzenAdj Debug] Process crashed post-write (STATUS_ACCESS_VIOLATION) — verify applied values separately");
    }
    println!("[RyzenAdj Debug] -------------------------");

    use std::os::windows::process::ExitStatusExt;
    let os_status = std::process::ExitStatus::from_raw(exit_code as u32);

    Ok(std::process::Output {
        status: os_status,
        stdout: stdout.into_bytes(),
        stderr: stderr.into_bytes(),
    })
}

// Previous execution wrappers preserved in comments as backup per user guidelines

/*
// Triggered 0xC0000005 (Access Violation) inside GUI context when stdout/stderr pipes are redirected
fn execute_ryzenadj_direct_old(exe: &Path, args: &[&str]) -> std::io::Result<std::process::Output> {
    let mut cmd = Command::new(exe);
    cmd.args(args);

    if let Some(parent) = exe.parent() {
        cmd.current_dir(parent);
    }

    cmd.output()
}

// Triggered 0xC0000005 inside GUI context because cmd.output() force-redirects stdout/stderr pipes
fn execute_ryzenadj_via_cmd(exe: &Path, args: &[&str]) -> std::io::Result<std::process::Output> {
    let mut cmd = Command::new("cmd");
    cmd.arg("/c");

    let command_string = format!("ryzenadj.exe {}", args.join(" "));
    cmd.arg(&command_string);

    if let Some(parent) = exe.parent() {
        if parent.exists() && parent.is_dir() {
            cmd.current_dir(parent);
        }
    }

    cmd.output()
}
*/

fn run_ryzenadj(args: &[&str]) -> RyzenAdjResponse {
    let _lock = ryzenadj_mutex().lock().unwrap();

    let mut admin_cmd = Command::new("net");
    admin_cmd.arg("session");
    #[cfg(windows)]
    admin_cmd.creation_flags(0x08000000);

    let is_admin = admin_cmd.output()
        .map(|o| o.status.success())
        .unwrap_or(false);
    println!("[RyzenAdj] Process elevated (Administrator): {}", is_admin);

    let exe = find_ryzenadj_exe();
    let sys_missing = if let Some(parent) = exe.parent() {
        !parent.join("WinRing0x64.sys").exists()
    } else {
        false
    };
    
    println!("[RyzenAdj] Executing via Direct Spawn: {:?} {:?}", exe, args);
    if sys_missing {
        println!("[RyzenAdj Warning] WinRing0x64.sys is missing from parent directory!");
    }

    let output = execute_ryzenadj_direct(&exe, args);

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&o.stderr).trim().to_string();
            let status_code = o.status.code().unwrap_or(-1);
            
            let log_msg = format!("RyzenAdj Run - Args: {:?}, Exit Code: {}, stdout: {}, stderr: {}", args, status_code, stdout, stderr);
            crate::core::logger::add_log(&log_msg);

            println!("[RyzenAdj] stdout: {}", stdout);
            if !stderr.is_empty() {
                println!("[RyzenAdj] stderr: {}", stderr);
            }
            println!("[RyzenAdj] Exit Status Code: {}", status_code);

            // STATUS_ACCESS_VIOLATION: ryzenadj crashes on exit after successfully writing values (known Hawk Point behavior)
            if status_code == -1073741819 || status_code as u32 == 0xC0000005 {
                println!("[RyzenAdj] Known post-write crash (STATUS_ACCESS_VIOLATION) — values applied successfully.");
                return RyzenAdjResponse {
                    success: true,
                    message: "Ryzen CPU Limits applied successfully.".to_string(),
                    data: Some(json!({ "stdout": stdout, "note": "Process crashed on exit (STATUS_ACCESS_VIOLATION) but values were written successfully." })),
                };
            }

            if o.status.success() {
                RyzenAdjResponse {
                    success: true,
                    message: "Ryzen CPU Limits applied successfully.".to_string(),
                    data: Some(json!({ "stdout": stdout })),
                }
            } else {
                let has_perm_error = stderr.contains("os_access") 
                    || stderr.contains("permission") 
                    || stdout.contains("os_access") 
                    || stdout.contains("permission")
                    || stdout.contains("Unable to get")
                    || stdout.contains("Unable to init");

                let msg = if sys_missing {
                    "Unable to get CPU access: WinRing0x64.sys is missing from the application directory. It may have been quarantined by your antivirus. Please restore it and add a security exclusion.".to_string()
                } else if has_perm_error {
                    "Unable to get CPU access. Please verify the application is running with Administrator/elevated permissions, and that Windows Core Isolation (Memory Integrity) is turned OFF.".to_string()
                } else if !stderr.is_empty() {
                    stderr.clone()
                } else if !stdout.is_empty() {
                    stdout.clone()
                } else {
                    format!("RyzenAdj execution failed (Exit Code: {}). Elevated Administrator privileges are required, and Core Isolation (Memory Integrity) must be turned OFF.", status_code)
                };

                RyzenAdjResponse {
                    success: false,
                    message: msg,
                    data: Some(json!({ "stdout": stdout, "stderr": stderr, "exit_code": status_code })),
                }
            }
        }
        Err(e) => {
            let log_msg = format!("RyzenAdj Error - Args: {:?}, Error: {}", args, e);
            crate::core::logger::add_log(&log_msg);

            let msg = if e.kind() == std::io::ErrorKind::NotFound {
                format!("ryzenadj.exe was not found. Please ensure it is located at {:?} or in your system PATH.", exe)
            } else {
                format!("Failed to execute ryzenadj: {}", e)
            };
            RyzenAdjResponse {
                success: false,
                message: msg,
                data: None,
            }
        }
    }
}

pub fn set_performance_mode() -> RyzenAdjResponse {
    run_ryzenadj(&[
        "--stapm-limit=55000",
        "--fast-limit=55000",
        "--slow-limit=55000",
        "--tctl-temp=90",
        "--apu-skin-temp=56",
    ])
}

pub fn set_balanced_mode() -> RyzenAdjResponse {
    run_ryzenadj(&[
        "--stapm-limit=35000",
        "--fast-limit=35000",
        "--slow-limit=35000",
        "--tctl-temp=80",
        "--apu-skin-temp=48",
    ])
}

pub fn set_silent_mode() -> RyzenAdjResponse {
    run_ryzenadj(&[
        "--stapm-limit=15000",
        "--fast-limit=15000",
        "--slow-limit=15000",
        "--tctl-temp=70",
        "--apu-skin-temp=40",
    ])
}

pub fn set_custom_limits(mut tdp_watts: u32, mut temp_limit: u32) -> RyzenAdjResponse {
    if tdp_watts < 8 {
        tdp_watts = 8;
    } else if tdp_watts > 55 {
        tdp_watts = 55;
    }
    if temp_limit < 50 {
        temp_limit = 50;
    } else if temp_limit > 95 {
        temp_limit = 95;
    }
    let tdp_mw = tdp_watts * 1000;
    let tdp_str = tdp_mw.to_string();
    let temp_str = temp_limit.to_string();
    run_ryzenadj(&[
        &format!("--stapm-limit={}", tdp_str),
        &format!("--fast-limit={}", tdp_str),
        &format!("--slow-limit={}", tdp_str),
        &format!("--tctl-temp={}", temp_str),
        "--apu-skin-temp=56",
    ])
}

pub fn get_dgpu_brand() -> &'static str {
    static BRAND: OnceLock<String> = OnceLock::new();
    BRAND.get_or_init(|| {
        let mut cmd = Command::new("powershell");
        cmd.args(["-Command", "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"]);
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);
        
        if let Ok(output) = cmd.output() {
            let names = String::from_utf8_lossy(&output.stdout).to_uppercase();
            if names.contains("NVIDIA") || names.contains("GEFORCE") || names.contains("RTX") || names.contains("GTX") {
                "NVIDIA".to_string()
            } else if names.contains("RADEON") || names.contains("AMD") {
                if names.contains("NVIDIA") {
                    "NVIDIA".to_string()
                } else {
                    "AMD".to_string()
                }
            } else {
                "UNKNOWN".to_string()
            }
        } else {
            "UNKNOWN".to_string()
        }
    })
}

pub fn get_cpu_brand_name() -> &'static str {
    static CPU_NAME: OnceLock<String> = OnceLock::new();
    CPU_NAME.get_or_init(|| {
        let mut cmd = Command::new("powershell");
        cmd.args(["-Command", "Get-CimInstance Win32_Processor | Select-Object -ExpandProperty Name"]);
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);
        
        if let Ok(output) = cmd.output() {
            let raw_name = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let clean = raw_name
                .split(" w/")
                .next()
                .unwrap_or(&raw_name)
                .split(" with")
                .next()
                .unwrap_or(&raw_name)
                .trim()
                .to_string();
            clean
        } else {
            "AMD Ryzen CPU".to_string()
        }
    })
}


pub fn get_cpu_status() -> RyzenAdjResponse {
    let _lock = ryzenadj_mutex().lock().unwrap();
    let exe = find_ryzenadj_exe();
    let sys_missing = if let Some(parent) = exe.parent() {
        !parent.join("WinRing0x64.sys").exists()
    } else {
        false
    };
    
    let output = execute_ryzenadj_direct(&exe, &["--info"]);

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let stderr = String::from_utf8_lossy(&o.stderr);

            if !o.status.success() || stdout.contains("Unable to get") || stdout.contains("Unable to init") {
                let status_code = o.status.code().unwrap_or(-1);
                let msg = if sys_missing {
                    "Unable to get CPU access: WinRing0x64.sys is missing from the application directory. It may have been quarantined by your antivirus. Please restore it and add a security exclusion."
                } else if status_code == -1073741819 || status_code as u32 == 0xC0000005 {
                    "RyzenAdj process crashed on exit (STATUS_ACCESS_VIOLATION). Read values above may still be valid — verify independently."
                } else if stderr.contains("os_access") || stderr.contains("permission") || stdout.contains("os_access") {
                    "Unable to get CPU access. RyzenAdj requires elevated / Administrator permissions, and Core Isolation (Memory Integrity) must be turned OFF."
                } else {
                    "Failed to query CPU limits."
                };
                return RyzenAdjResponse {
                    success: false,
                    message: msg.to_string(),
                    data: Some(json!({ "stdout": stdout.trim(), "stderr": stderr.trim() })),
                };
            }

            // Parse stdout lines
            let mut stapm_limit = 0.0;
            let mut stapm_value = 0.0;
            let mut fast_limit = 0.0;
            let mut fast_value = 0.0;
            let mut slow_limit = 0.0;
            let mut slow_value = 0.0;
            let mut stapm_time = 0.0;
            let mut slow_time = 0.0;
            let mut tctl_limit = 0.0;
            let mut tctl_value = 0.0;
            let mut apu_skin_limit = 0.0;
            let mut apu_skin_value = 0.0;
            let mut dgpu_skin_limit = 0.0;
            let mut dgpu_skin_value = 0.0;

            for line in stdout.lines() {
                let lower = line.to_lowercase();
                if lower.contains("stapm limit") {
                    if let Some(val) = parse_line_value(line) { stapm_limit = val; }
                } else if lower.contains("stapm value") {
                    if let Some(val) = parse_line_value(line) { stapm_value = val; }
                } else if lower.contains("ppt limit fast") {
                    if let Some(val) = parse_line_value(line) { fast_limit = val; }
                } else if lower.contains("ppt value fast") {
                    if let Some(val) = parse_line_value(line) { fast_value = val; }
                } else if lower.contains("ppt limit slow") {
                    if let Some(val) = parse_line_value(line) { slow_limit = val; }
                } else if lower.contains("ppt value slow") {
                    if let Some(val) = parse_line_value(line) { slow_value = val; }
                } else if lower.contains("stapmtimeconst") {
                    if let Some(val) = parse_line_value(line) { stapm_time = val; }
                } else if lower.contains("slowppttimeconst") {
                    if let Some(val) = parse_line_value(line) { slow_time = val; }
                } else if lower.contains("thm limit core") || lower.contains("tctl limit") {
                    if let Some(val) = parse_line_value(line) { tctl_limit = val; }
                } else if lower.contains("thm value core") || lower.contains("tctl value") {
                    if let Some(val) = parse_line_value(line) { tctl_value = val; }
                } else if lower.contains("stt limit apu") {
                    if let Some(val) = parse_line_value(line) { apu_skin_limit = val; }
                } else if lower.contains("stt value apu") {
                    if let Some(val) = parse_line_value(line) { apu_skin_value = val; }
                } else if lower.contains("stt limit dgpu") {
                    if let Some(val) = parse_line_value(line) { dgpu_skin_limit = val; }
                } else if lower.contains("stt value dgpu") {
                    if let Some(val) = parse_line_value(line) { dgpu_skin_value = val; }
                }
            }

            RyzenAdjResponse {
                success: true,
                message: "CPU limits retrieved successfully.".to_string(),
                data: Some(json!({
                    "stapm_limit": stapm_limit,
                    "stapm_value": stapm_value,
                    "fast_limit": fast_limit,
                    "fast_value": fast_value,
                    "slow_limit": slow_limit,
                    "slow_value": slow_value,
                    "stapm_time": stapm_time,
                    "slow_time": slow_time,
                    "tctl_limit": tctl_limit,
                    "tctl_value": tctl_value,
                    "apu_skin_limit": apu_skin_limit,
                    "apu_skin_value": apu_skin_value,
                    "dgpu_skin_limit": dgpu_skin_limit,
                    "dgpu_skin_value": dgpu_skin_value,
                    "dgpu_brand": get_dgpu_brand(),
                    "cpu_name": get_cpu_brand_name(),
                })),
            }
        }
        Err(e) => {
            RyzenAdjResponse {
                success: false,
                message: format!("Failed to run ryzenadj status check: {}", e),
                data: None,
            }
        }
    }
}

fn parse_line_value(line: &str) -> Option<f64> {
    // A table row typically looks like: | STAPM Limit | 45.000 | stapm-limit |
    // Split by '|' and look at the second item
    let parts: Vec<&str> = line.split('|').collect();
    if parts.len() >= 3 {
        let val_str = parts[2].trim();
        if let Ok(val) = val_str.parse::<f64>() {
            return Some(val);
        }
    }
    
    // Fallback: search for numbers in the line if it is not a pipes-table
    let mut current_num = String::new();
    let mut found_dot = false;
    for c in line.chars() {
        if c.is_ascii_digit() {
            current_num.push(c);
        } else if c == '.' && !found_dot {
            current_num.push(c);
            found_dot = true;
        } else if !current_num.is_empty() {
            if let Ok(val) = current_num.parse::<f64>() {
                return Some(val);
            }
            current_num.clear();
            found_dot = false;
        }
    }
    if !current_num.is_empty() {
        if let Ok(val) = current_num.parse::<f64>() {
            return Some(val);
        }
    }
    None
}
