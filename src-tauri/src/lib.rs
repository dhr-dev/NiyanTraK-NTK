mod core;

use core::profiles::get_profile;
use core::executor::apply_profile;
use crate::core::fan::apply_fan_mode;
use core::ryzen_adj::{RyzenAdjResponse, set_performance_mode, set_balanced_mode, set_silent_mode, set_custom_limits, get_cpu_status as query_cpu_status};
use core::stress::{start_cpu_stress, stop_cpu_stress, get_stress_status};

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[derive(Default)]
pub struct AppState {
    pub minimize_to_tray: AtomicBool,
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
            get_minimize_to_tray
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