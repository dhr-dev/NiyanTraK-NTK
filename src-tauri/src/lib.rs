mod core;

use core::profiles::get_profile;
use core::executor::apply_profile;
use crate::core::fan::{apply_fan_mode, SmartFanState, SmartFanConfig, process_smart_fan};
use core::ryzen_adj::{RyzenAdjResponse, set_performance_mode, set_balanced_mode, set_silent_mode, set_custom_limits, get_cpu_status as query_cpu_status};
use core::stress::{start_cpu_stress, stop_cpu_stress, get_stress_status};

use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[derive(Default)]
pub struct AppState {
    pub minimize_to_tray: AtomicBool,
    pub smart_fan: Mutex<SmartFanState>,
    pub export_on_shutdown: AtomicBool,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WidgetConfig {
    pub show_temp: bool,
    pub show_tdp: bool,
    pub show_fan: bool,
    pub show_profiles: bool,
}

impl Default for WidgetConfig {
    fn default() -> Self {
        Self {
            show_temp: true,
            show_tdp: true,
            show_fan: true,
            show_profiles: true,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub minimize_to_tray: bool,
    pub start_on_startup: bool,
    pub log_export_schedule: String,
    pub custom_log_export_hours: u32,
    pub export_on_shutdown: bool,
    pub active_profile_name: String,
    pub custom_tdp: u32,
    pub custom_temp_limit: u32,
    pub fan_level: u32,
    pub fan_enabled: bool,
    pub smart_fan_config: SmartFanConfig,
    pub widget: WidgetConfig,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            minimize_to_tray: false,
            start_on_startup: false,
            log_export_schedule: "disabled".to_string(),
            custom_log_export_hours: 1,
            export_on_shutdown: false,
            active_profile_name: "laptop".to_string(),
            custom_tdp: 35,
            custom_temp_limit: 80,
            fan_level: 30,
            fan_enabled: false,
            smart_fan_config: SmartFanConfig::default(),
            widget: WidgetConfig::default(),
        }
    }
}

fn get_config_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create AppData folder: {}", e))?;
    Ok(app_dir.join("app_config.toml"))
}

fn load_config_internal(app: &tauri::AppHandle) -> AppConfig {
    if let Ok(path) = get_config_path(app) {
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(&path) {
                if let Ok(config) = toml::from_str::<AppConfig>(&content) {
                    return config;
                }
            }
        }
    }
    AppConfig::default()
}

fn save_config_internal(app: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = get_config_path(app)?;
    let content = toml::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

#[tauri::command]
fn get_app_config(app: tauri::AppHandle) -> AppConfig {
    load_config_internal(&app)
}

#[tauri::command]
fn save_app_config(app: tauri::AppHandle, state: tauri::State<'_, AppState>, config: AppConfig) -> Result<(), String> {
    state.minimize_to_tray.store(config.minimize_to_tray, Ordering::Relaxed);
    state.export_on_shutdown.store(config.export_on_shutdown, Ordering::Relaxed);
    if let Ok(mut smart_fan) = state.smart_fan.lock() {
        smart_fan.config = config.smart_fan_config.clone();
    }
    save_config_internal(&app, &config)
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
fn set_export_on_shutdown(state: tauri::State<'_, AppState>, enabled: bool) {
    state.export_on_shutdown.store(enabled, Ordering::Relaxed);
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


#[cfg(target_os = "windows")]
#[repr(C)]
#[derive(Default)]
#[allow(non_snake_case)]
struct SYSTEMTIME {
    wYear: u16,
    wMonth: u16,
    wDayOfWeek: u16,
    wDay: u16,
    wHour: u16,
    wMinute: u16,
    wSecond: u16,
    wMilliseconds: u16,
}

#[cfg(target_os = "windows")]
extern "system" {
    fn GetLocalTime(lpSystemTime: *mut SYSTEMTIME);
}

fn get_local_timestamp() -> String {
    #[cfg(target_os = "windows")]
    {
        let mut st = SYSTEMTIME::default();
        unsafe {
            GetLocalTime(&mut st);
        }
        format!(
            "{:04}{:02}{:02}_{:02}{:02}{:02}",
            st.wYear, st.wMonth, st.wDay, st.wHour, st.wMinute, st.wSecond
        )
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs().to_string())
            .unwrap_or_else(|_| "unknown".to_string())
    }
}

use std::sync::atomic::AtomicU32;
static HEART_CLICKS: AtomicU32 = AtomicU32::new(0);

#[tauri::command]
fn register_heart_click(app: tauri::AppHandle) -> Result<String, String> {
    let clicks = HEART_CLICKS.fetch_add(1, Ordering::Relaxed) + 1;
    if clicks >= 9 {
        HEART_CLICKS.store(0, Ordering::Relaxed);
        let logs = core::logger::get_recent_logs();
        if let Ok(mut doc_dir) = app.path().document_dir() {
            doc_dir.push("NTK");
            if let Err(e) = std::fs::create_dir_all(&doc_dir) {
                return Err(format!("Failed to create NTK directory: {}", e));
            }
            let timestamp_str = get_local_timestamp();
            let log_file = doc_dir.join(format!("debug_logs_{}.txt", timestamp_str));
            if let Err(e) = std::fs::write(&log_file, &logs) {
                return Err(format!("Failed to write debug log: {}", e));
            }
            return Ok(format!("Logs successfully exported to {}", log_file.to_string_lossy()));
        }
        return Err("Failed to resolve Documents directory".to_string());
    }
    Ok(format!("Click registered ({}/9)", clicks))
}

#[tauri::command]
fn export_debug_logs(app: tauri::AppHandle, is_scheduled: bool, timestamp: String) -> Result<String, String> {
    let logs = core::logger::get_recent_logs();
    if let Ok(mut doc_dir) = app.path().document_dir() {
        doc_dir.push("NTK");
        if is_scheduled {
            doc_dir.push("Scheduled");
        }
        if let Err(e) = std::fs::create_dir_all(&doc_dir) {
            return Err(format!("Failed to create directory: {}", e));
        }

        let filename = if is_scheduled {
            format!("scheduled_logs_{}.txt", timestamp)
        } else {
            format!("debug_logs_{}.txt", timestamp)
        };

        let log_file = doc_dir.join(filename);
        if let Err(e) = std::fs::write(&log_file, &logs) {
            return Err(format!("Failed to write debug log: {}", e));
        }
        return Ok(log_file.to_string_lossy().to_string());
    }
    Err("Failed to resolve Documents directory".to_string())
}

#[tauri::command]
fn set_autostart(enabled: bool) -> Result<(), String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get current executable path: {}", e))?;
    let exe_str = exe_path.to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?;

    if enabled {
        let mut cmd = std::process::Command::new("schtasks");
        cmd.args(&[
            "/create",
            "/tn", "NiyanTraK_Autostart",
            "/tr", &format!("\"{}\" --autostart", exe_str),
            "/sc", "onlogon",
            "/rl", "highest",
            "/f"
        ]);
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);

        let status = cmd.status()
            .map_err(|e| format!("Failed to execute schtasks command: {}", e))?;

        if !status.success() {
            return Err("schtasks command exited with error status".to_string());
        }
    } else {
        let mut cmd = std::process::Command::new("schtasks");
        cmd.args(&[
            "/delete",
            "/tn", "NiyanTraK_Autostart",
            "/f"
        ]);
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);

        let _ = cmd.status();
    }
    Ok(())
}

#[tauri::command]
fn get_autostart() -> Result<bool, String> {
    let mut cmd = std::process::Command::new("schtasks");
    cmd.args(&[
        "/query",
        "/tn", "NiyanTraK_Autostart"
    ]);
    #[cfg(windows)]
    cmd.creation_flags(0x08000000);

    let output = cmd.output()
        .map_err(|e| format!("Failed to execute schtasks query: {}", e))?;

    Ok(output.status.success())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    match tauri::Builder::default()
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
            get_smart_fan_config,
            export_debug_logs,
            set_autostart,
            get_autostart,
            set_export_on_shutdown,
            get_app_config,
            save_app_config
        ])
        .setup(|app| {
            // Load and reapply settings immediately on boot
            let config = load_config_internal(app.app_handle());
            
            // 1. Sync AppState parameters
            let state = app.state::<AppState>();
            state.minimize_to_tray.store(config.minimize_to_tray, Ordering::Relaxed);
            state.export_on_shutdown.store(config.export_on_shutdown, Ordering::Relaxed);
            if let Ok(mut smart_fan) = state.smart_fan.lock() {
                smart_fan.config = config.smart_fan_config.clone();
            }

            // 2. Reapply hardware settings (TDP / Temp limits / Fan speed)
            println!("[Boot Config] Reapplying stored profile settings...");
            if config.active_profile_name == "battery" ||
               config.active_profile_name == "laptop" ||
               config.active_profile_name == "table" ||
               config.active_profile_name == "performance" ||
               config.active_profile_name == "extreme" {
                // Apply standard profile limit
                match get_profile(&config.active_profile_name) {
                    Some(p) => {
                        let res = apply_profile(p);
                        println!("[Boot Config] Profile '{}' applied: {}", config.active_profile_name, res.trim());
                    }
                    None => {
                        let res = set_custom_limits(config.custom_tdp, config.custom_temp_limit);
                        println!("[Boot Config] Fallback limits applied: Success = {}", res.success);
                    }
                }
            } else {
                // For custom presets or manual custom adjustments, apply the saved raw values
                let res = set_custom_limits(config.custom_tdp, config.custom_temp_limit);
                println!("[Boot Config] Custom/Preset limits applied: Success = {}", res.success);
                
                // If smart fan is enabled, it will run automatically. Otherwise apply manual fan level if enabled.
                if !config.smart_fan_config.enabled {
                    if config.fan_enabled {
                        let padded = format!("{:02}", config.fan_level);
                        let res_fan = apply_fan_mode(&format!("{}:{}", padded, padded));
                        println!("[Boot Config] Manual Fan Level applied: {}", res_fan.trim());
                    } else {
                        apply_fan_mode("0:0");
                        println!("[Boot Config] Fan set to Auto/HP Control");
                    }
                }
            }
            // Check command line arguments
            let args: Vec<String> = std::env::args().collect();
            let launch_as_widget = args.contains(&"--widget".to_string());
            let launch_minimized = args.contains(&"--minimized".to_string()) || args.contains(&"--autostart".to_string());

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
                if !launch_minimized {
                    if let Some(main_window) = app.get_webview_window("main") {
                        let _ = main_window.show();
                    }
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
        .build(tauri::generate_context!())
    {
        Ok(app) => {
            app.run(|app_handle, event| {
                if let tauri::RunEvent::Exit = event {
                    let state = app_handle.state::<AppState>();
                    if state.export_on_shutdown.load(Ordering::Relaxed) {
                        let logs = core::logger::get_recent_logs();
                        if let Ok(mut doc_dir) = app_handle.path().document_dir() {
                            doc_dir.push("NTK");
                            let _ = std::fs::create_dir_all(&doc_dir);
                            let timestamp_str = get_local_timestamp();
                            let log_file = doc_dir.join(format!("shutdown_debug_logs_{}.txt", timestamp_str));
                            let _ = std::fs::write(&log_file, &logs);
                        }
                    }
                }
            });
        }
        Err(e) => {
            eprintln!("Tauri build error: {:?}", e);
        }
    }
}