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

    let full_command = format!("& '{}' -SetFanLevel {}", script_path, level);

    match crate::core::ps_session::run_command(&full_command) {
        Ok(output_str) => {
            let log_msg = format!("Fan Mode - Applied Level [{}], Mode [{}], output: {}", level, mode, output_str.trim());
            crate::core::logger::add_log(&log_msg);

            format!(
                "fan mode: {}\nlevel: {}\nstdout:\n{}\nstderr:\n",
                mode, level, output_str
            )
        }
        Err(e) => {
            let log_msg = format!("Fan Mode - Applied Level [{}], Mode [{}], Error: {}", level, mode, e);
            crate::core::logger::add_log(&log_msg);
            format!("execution error: {}", e)
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct FanCurvePoint {
    pub temp: f64,
    pub level: u32,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct SmartFanConfig {
    pub enabled: bool,
    pub points: Vec<FanCurvePoint>,
    // Removed hysteresis_temp per user request as lower markings act as shift down
    // pub hysteresis_temp: f64,
    pub instant_spool_temp: f64,
    pub average_poll_size: u32,
    pub cooldown_secs: u64,
    pub advanced: bool,
}

impl Default for SmartFanConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            points: vec![
                FanCurvePoint { temp: 40.0, level: 9 },  // 1200 RPM
                FanCurvePoint { temp: 50.0, level: 14 }, // 2000 RPM
                FanCurvePoint { temp: 65.0, level: 19 }, // 2500 RPM (changed 60.0 to 65.0, removed 70.0 point per user request)
                FanCurvePoint { temp: 75.0, level: 26 }, // 3800 RPM
                FanCurvePoint { temp: 80.0, level: 29 }, // 4200 RPM
                FanCurvePoint { temp: 85.0, level: 32 }, // 5000 RPM
                FanCurvePoint { temp: 90.0, level: 39 }, // 5700 RPM
            ],
            // hysteresis_temp: 3.0,
            instant_spool_temp: 85.0,
            average_poll_size: 3,
            cooldown_secs: 10,
            advanced: false,
        }
    }
}

pub struct SmartFanState {
    pub config: SmartFanConfig,
    pub temp_history: Vec<f64>,
    pub last_applied_level: u32,
    pub last_applied_time: u64,
}

impl Default for SmartFanState {
    fn default() -> Self {
        Self {
            config: SmartFanConfig::default(),
            temp_history: Vec::new(),
            last_applied_level: 0,
            last_applied_time: 0,
        }
    }
}

pub fn interpolate_fan_level(temp: f64, points: &[FanCurvePoint]) -> u32 {
    if points.is_empty() {
        return 30; // default fallback
    }

    let mut sorted_points = points.to_vec();
    sorted_points.sort_by(|a, b| a.temp.partial_cmp(&b.temp).unwrap_or(std::cmp::Ordering::Equal));

    // If temp is below the first point's temperature, run at the first point's level
    if temp < sorted_points[0].temp {
        return sorted_points[0].level;
    }

    // Find the highest point whose temperature threshold is met
    let mut selected_level = sorted_points[0].level;
    for pt in &sorted_points {
        if temp >= pt.temp {
            selected_level = pt.level;
        } else {
            break;
        }
    }

    selected_level
}

pub fn process_smart_fan(temp: f64, skin_temp: f64, state: &mut SmartFanState) -> (u32, f64, bool, bool) {
    if !state.config.enabled {
        return (0, 0.0, false, false);
    }

    // Ignore invalid/glitched temperature readings (e.g. <= 20°C or > 120°C)
    if temp <= 20.0 || temp > 120.0 {
        let last_valid_decision = if state.temp_history.is_empty() {
            temp
        } else {
            state.temp_history.iter().sum::<f64>() / state.temp_history.len() as f64
        };
        return (state.last_applied_level, last_valid_decision, false, false);
    }

    // Add temp to rolling queue
    state.temp_history.push(temp);
    
    // Maintain rolling average size based on user configuration
    let poll_size = state.config.average_poll_size.max(1) as usize;
    while state.temp_history.len() > poll_size {
        state.temp_history.remove(0);
    }

    // Calculate rolling average
    let rolling_avg_temp = if state.temp_history.is_empty() {
        temp
    } else {
        let sum: f64 = state.temp_history.iter().sum();
        sum / state.temp_history.len() as f64
    };

    let min_lvl = if state.config.advanced { 0 } else { 8 };
    
    // Interpolate raw level for instant spool-up check
    let raw_target_level = interpolate_fan_level(temp, &state.config.points).clamp(min_lvl, 39);

    // Spool up instantly only if raw temp > threshold AND it calls for a higher speed
    let is_instant = temp > state.config.instant_spool_temp && raw_target_level > state.last_applied_level;

    let decision_temp = if is_instant {
        temp
    } else {
        rolling_avg_temp
    };

    let target_level = interpolate_fan_level(decision_temp, &state.config.points);
    let mut target_level = target_level.clamp(min_lvl, 39);

    // Safety overrides: force higher fan levels if temperatures get dangerously high
    if temp >= 95.0 || skin_temp >= 56.0 {
        target_level = target_level.max(39);
    } else if temp >= 90.0 || skin_temp >= 52.0 {
        target_level = target_level.max(30);
    }

    let current_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let mut applied_change = false;

    if state.last_applied_level == 0 {
        state.last_applied_level = target_level;
        state.last_applied_time = current_time;
        let padded = format!("{:02}", target_level);
        apply_fan_mode(&format!("{}:{}", padded, padded));
        applied_change = true;
    } else if target_level > state.last_applied_level {
        state.last_applied_level = target_level;
        state.last_applied_time = current_time;
        let padded = format!("{:02}", target_level);
        apply_fan_mode(&format!("{}:{}", padded, padded));
        applied_change = true;
    } else if target_level < state.last_applied_level {
        if current_time - state.last_applied_time >= state.config.cooldown_secs {
            state.last_applied_level = target_level;
            state.last_applied_time = current_time;
            let padded = format!("{:02}", target_level);
            apply_fan_mode(&format!("{}:{}", padded, padded));
            applied_change = true;
        }
    }

    (state.last_applied_level, decision_temp, is_instant, applied_change)
}
