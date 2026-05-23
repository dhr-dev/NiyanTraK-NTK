use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

pub fn apply_fan_mode(mode: &str) -> String {
    // 1. Resolve relative to the current running executable (works in production installations)
    let mut resolved_script = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|dir| dir.join("resources").join("OmenHwCtl.ps1")))
        .filter(|p| p.exists())
        .map(|p| p.to_string_lossy().to_string());

    // 2. Fallback: check current working directory resources directory (standard for tauri dev and cargo runs)
    if resolved_script.is_none() {
        let dev_path = std::path::Path::new("resources").join("OmenHwCtl.ps1");
        if dev_path.exists() {
            resolved_script = Some(dev_path.to_string_lossy().to_string());
        }
    }

    // 3. Fallback: default to local script name in current working directory
    let script_path = resolved_script.unwrap_or_else(|| String::from("OmenHwCtl.ps1"));

    let level = match mode {
        "silent" => "19:19",
        "balanced" | "bed" => "30:30",
        "medium" => "30:30",
        "high" => "34:34",
        "turbo" => "34:34",
        "max" => "39:39",
        custom if custom.contains(':') => custom,
        _ => "30:30",
    };

    let mut cmd = Command::new("powershell");
    cmd.args([
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        &script_path,
        "-SetFanLevel",
        level,
    ]);

    #[cfg(windows)]
    cmd.creation_flags(0x08000000);

    let output = cmd.output();

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let stderr = String::from_utf8_lossy(&o.stderr);

            let log_msg = format!("Fan Mode - Applied Level [{}], Mode [{}], stdout: {}, stderr: {}", level, mode, stdout.trim(), stderr.trim());
            crate::core::logger::add_log(&log_msg);

            format!(
                "fan mode: {}\nlevel: {}\nstdout:\n{}\nstderr:\n{}",
                mode, level, stdout, stderr
            )
        }
        Err(e) => {
            let log_msg = format!("Fan Mode - Applied Level [{}], Mode [{}], Error: {}", level, mode, e);
            crate::core::logger::add_log(&log_msg);
            format!("execution error: {}", e)
        }
    }
}