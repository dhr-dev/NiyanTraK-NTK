use std::process::Command;
use crate::core::profiles::Profile;

pub fn apply_profile(profile: Profile) -> String {

    let mut log = String::new();

    log.push_str(&format!("Applying profile: {}\n", profile.name));
    log.push_str(&format!("Power limit: {}W\n", profile.power_limit_w));
    log.push_str(&format!("Fan mode: {}\n", profile.fan_mode));

    // ----------------------------
    // SAFE EXECUTION LAYER (BASE)
    // ----------------------------

    // Example placeholder command execution layer
    let _ = Command::new("cmd")
        .args(["/C", "echo VictusDeck profile applied"])
        .output();

    log.push_str("System layer executed (placeholder)\n");

    log
}