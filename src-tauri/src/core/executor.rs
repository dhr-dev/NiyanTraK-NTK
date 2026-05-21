use std::process::Command;
use crate::core::profiles::Profile;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

pub fn apply_profile(profile: Profile) -> String {

    let mut log = String::new();

    log.push_str(&format!("Applying profile: {}\n", profile.name));
    log.push_str(&format!("Power limit: {}W\n", profile.power_limit_w));
    log.push_str(&format!("Fan mode: {}\n", profile.fan_mode));

    // ----------------------------
    // SAFE EXECUTION LAYER (BASE)
    // ----------------------------

    // Example placeholder command execution layer
    let mut cmd = Command::new("cmd");
    cmd.args(["/C", "echo NiyanTraK profile applied"]);
    #[cfg(windows)]
    cmd.creation_flags(0x08000000);
    let _ = cmd.output();

    log.push_str("System layer executed (placeholder)\n");

    log
}