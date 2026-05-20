use std::process::Command;

pub fn apply_fan_mode(mode: &str) -> String {
    let script_path = r"C:\Program Files\fanControl\omen-hub-but-better\OmenHwCtl.ps1";

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

    let output = Command::new("powershell")
        .args([
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            script_path,
            "-SetFanLevel",
            level,
        ])
        .output();

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let stderr = String::from_utf8_lossy(&o.stderr);

            format!(
                "fan mode: {}\nlevel: {}\nstdout:\n{}\nstderr:\n{}",
                mode, level, stdout, stderr
            )
        }
        Err(e) => format!("execution error: {}", e),
    }
}