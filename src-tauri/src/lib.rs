mod core;

use core::profiles::get_profile;
use core::executor::apply_profile;
use crate::core::fan::apply_fan_mode;
use core::ryzen_adj::{RyzenAdjResponse, set_performance_mode, set_balanced_mode, set_silent_mode, set_custom_limits, get_cpu_status as query_cpu_status};
use core::stress::{start_cpu_stress, stop_cpu_stress, get_stress_status};

#[tauri::command]
fn run_profile(profile: String) -> String {
    match get_profile(&profile) {
        Some(p) => apply_profile(p),
        None => "Unknown profile".to_string(),
    }
}

#[tauri::command]
fn set_fan_mode(mode: String) -> String {
    apply_fan_mode(&mode)
}

#[tauri::command]
async fn set_cpu_mode(mode: String) -> RyzenAdjResponse {
    match mode.as_str() {
        "performance" => set_performance_mode(),
        "balanced" | "bed" => set_balanced_mode(),
        "silent" => set_silent_mode(),
        _ => RyzenAdjResponse {
            success: false,
            message: format!("Unknown CPU mode: {}", mode),
            data: None,
        }
    }
}

#[tauri::command]
async fn set_cpu_tdp(value: u32, temp_limit: Option<u32>) -> RyzenAdjResponse {
    let t_limit = temp_limit.unwrap_or(90);
    set_custom_limits(value, t_limit)
}

#[tauri::command]
async fn save_custom_presets(presets: String) -> Result<String, String> {
    let presets_path = std::path::PathBuf::from(r"d:\Projects\UTILITY SOFT\Victus\victus-deck\custom_presets.json");
    std::fs::write(&presets_path, presets)
        .map_err(|e| format!("Failed to write preset config: {}", e))?;
    Ok("Custom presets saved successfully.".to_string())
}

#[tauri::command]
async fn load_custom_presets() -> Result<String, String> {
    let presets_path = std::path::PathBuf::from(r"d:\Projects\UTILITY SOFT\Victus\victus-deck\custom_presets.json");
    if !presets_path.exists() {
        return Ok("[]".to_string());
    }
    let content = std::fs::read_to_string(&presets_path)
        .map_err(|e| format!("Failed to read preset config: {}", e))?;
    Ok(content)
}

#[tauri::command]
async fn get_cpu_status() -> RyzenAdjResponse {
    query_cpu_status()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(e) = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_profile,
            set_fan_mode,
            set_cpu_mode,
            set_cpu_tdp,
            get_cpu_status,
            start_cpu_stress,
            stop_cpu_stress,
            get_stress_status,
            save_custom_presets,
            load_custom_presets
        ])
        .run(tauri::generate_context!())
    {
        eprintln!("Tauri error: {:?}", e);
    }
}