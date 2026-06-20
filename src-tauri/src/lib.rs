mod core;

use core::profiles::get_profile;
use core::executor::apply_profile;
use crate::core::fan::{apply_fan_mode, SmartFanState, SmartFanConfig, process_smart_fan};
use core::ryzen_adj::{RyzenAdjResponse, set_performance_mode, set_balanced_mode, set_silent_mode, set_custom_limits, get_cpu_status as query_cpu_status};
use core::stress::{start_cpu_stress, stop_cpu_stress, get_stress_status};

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[derive(Default)]
pub struct AppState {
    pub minimize_to_tray: AtomicBool,
    pub smart_fan: Mutex<SmartFanState>,
}

#[tauri::command]
fn set_minimize_to_tray(state: tauri::State<'_, AppState>, enabled: bool) {
    state.minimize_to_tray.store(enabled, Ordering::Relaxed);
}

#[tauri::command]
fn get_minimize_to_tray(state: tauri::State<'_, AppState>) -> bool {
    state.minimize_to_tray.load(Ordering::Relaxed)
}

#[tauri::command]
fn run_profile(profile: String) -> String {
    match get_profile(&profile) {
        Some(p) => apply_profile(p),
        None => "Unknown profile".to_string(),
    }
}

#[tauri::command]
fn set_fan_mode(state: tauri::State<'_, AppState>, mode: String) -> String {
    let parsed_level = match mode.as_str() {
        "silent" => 19,
        "balanced" | "medium" => 30,
        "high" | "turbo" => 34,
        "max" => 39,
        custom if custom.contains(':') => {
            custom.split(':').next().and_then(|s| s.parse::<u32>().ok()).unwrap_or(0)
        }
        _ => 0,
    };
    if let Ok(mut smart_fan) = state.smart_fan.lock() {
        if smart_fan.config.enabled {
            smart_fan.config.enabled = false;
            smart_fan.temp_history.clear();
        }
        smart_fan.last_applied_level = parsed_level;
    }
    apply_fan_mode(&mode)
}

#[tauri::command]
fn set_smart_fan_config(state: tauri::State<'_, AppState>, config: SmartFanConfig) -> Result<(), String> {
    let mut smart_fan = state.smart_fan.lock().map_err(|e| e.to_string())?;
    if !config.enabled && smart_fan.config.enabled {
        smart_fan.last_applied_level = 0;
        smart_fan.temp_history.clear();
    }
    smart_fan.config = config;
    Ok(())
}

#[tauri::command]
fn get_smart_fan_config(state: tauri::State<'_, AppState>) -> Result<SmartFanConfig, String> {
    let smart_fan = state.smart_fan.lock().map_err(|e| e.to_string())?;
    Ok(smart_fan.config.clone())
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
async fn save_custom_presets(app: tauri::AppHandle, presets: String) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create AppData folder: {}", e))?;
    let presets_path = app_dir.join("custom_presets.json");
    std::fs::write(&presets_path, presets)
        .map_err(|e| format!("Failed to write preset config: {}", e))?;
    Ok("Custom presets saved successfully.".to_string())
}

#[tauri::command]
async fn load_custom_presets(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let presets_path = app_dir.join("custom_presets.json");
    if !presets_path.exists() {
        return Ok("[]".to_string());
    }
    let content = std::fs::read_to_string(&presets_path)
        .map_err(|e| format!("Failed to read preset config: {}", e))?;
    Ok(content)
}

#[tauri::command]
fn get_cpu_status(state: tauri::State<'_, AppState>) -> RyzenAdjResponse {
    let mut res = query_cpu_status();
    if res.success {
        if let Some(ref mut data) = res.data {
            if let Some(obj) = data.as_object_mut() {
                let mut active_level = 0;
                let mut is_enabled = false;
                let mut decision_temp = 0.0;
                let mut is_instant = false;
                
                if let Ok(mut smart_fan) = state.smart_fan.lock() {
                    is_enabled = smart_fan.config.enabled;
                    if is_enabled {
                        if let Some(temp_val) = obj.get("tctl_value").and_then(|v| v.as_f64()) {
                            let (applied_level, d_temp, was_instant, _changed) = process_smart_fan(temp_val, &mut *smart_fan);
                            active_level = applied_level;
                            decision_temp = d_temp;
                            is_instant = was_instant;
                        }
                    } else {
                        active_level = smart_fan.last_applied_level;
                    }
                }
                
                obj.insert("smart_fan_enabled".to_string(), serde_json::Value::Bool(is_enabled));
                obj.insert("smart_fan_active_level".to_string(), serde_json::Value::Number(serde_json::Number::from(active_level)));
                if is_enabled {
                    obj.insert("smart_fan_decision_temp".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(decision_temp).unwrap_or(serde_json::Number::from(0))));
                    obj.insert("smart_fan_is_instant".to_string(), serde_json::Value::Bool(is_instant));
                }
            }
        }
    }
    res
}


use std::sync::atomic::AtomicU32;
static HEART_CLICKS: AtomicU32 = AtomicU32::new(0);

#[tauri::command]
fn register_heart_click() -> Result<String, String> {
    let clicks = HEART_CLICKS.fetch_add(1, Ordering::Relaxed) + 1;
    if clicks >= 9 {
        HEART_CLICKS.store(0, Ordering::Relaxed);
        
        let logs = core::logger::get_recent_logs();
        
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let log_file = exe_dir.join("victus_deck_debug_logs.txt");
                if let Err(e) = std::fs::write(&log_file, &logs) {
                    return Err(format!("Failed to write debug log: {}", e));
                }
                return Ok(format!("Logs successfully exported to {:?}", log_file));
            }
        }
        return Err("Failed to resolve root installation directory".to_string());
    }
    Ok(format!("Click registered ({}/9)", clicks))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(e) = tauri::Builder::default()
        .manage(AppState::default())
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
            load_custom_presets,
            set_minimize_to_tray,
            get_minimize_to_tray,
            register_heart_click,
            set_smart_fan_config,
            get_smart_fan_config
        ])
        .setup(|app| {
            // Check command line arguments
            let args: Vec<String> = std::env::args().collect();
            let launch_as_widget = args.contains(&"--widget".to_string());

            if launch_as_widget {
                // Spawn widget window
                let _widget_window = tauri::WebviewWindowBuilder::new(
                    app,
                    "widget",
                    tauri::WebviewUrl::App("index.html?window=widget".into()),
                )
                .title("NiyanTraK Widget")
                .inner_size(210.0, 188.0) // default size
                .decorations(false)
                .always_on_top(true)
                .resizable(false)
                .transparent(true)
                .skip_taskbar(true)
                .build()?;
            } else {
                // Show the main window
                if let Some(main_window) = app.get_webview_window("main") {
                    let _ = main_window.show();
                }
            }

            // Create System Tray context menu
            let tray_menu = Menu::with_items(
                app,
                &[
                    &MenuItem::with_id(app, "show_app", "Show App", true, None::<&str>)?,
                    &MenuItem::with_id(app, "toggle_widget", "Toggle Widget", true, None::<&str>)?,
                    &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
                ],
            )?;

            // Build Tray Icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show_app" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "toggle_widget" => {
                        if let Some(widget) = app.get_webview_window("widget") {
                            let _ = widget.close();
                        } else {
                            let _ = tauri::WebviewWindowBuilder::new(
                                app,
                                "widget",
                                tauri::WebviewUrl::App("index.html?window=widget".into()),
                            )
                            .title("NiyanTraK Widget")
                            .inner_size(210.0, 188.0)
                            .decorations(false)
                            .always_on_top(true)
                            .resizable(false)
                            .transparent(true)
                            .skip_taskbar(true)
                            .build();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Resized(_) = event {
                if let Ok(true) = window.is_minimized() {
                    let state = window.state::<AppState>();
                    if state.minimize_to_tray.load(Ordering::Relaxed) {
                        let _ = window.hide();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
    {
        eprintln!("Tauri error: {:?}", e);
    }
}