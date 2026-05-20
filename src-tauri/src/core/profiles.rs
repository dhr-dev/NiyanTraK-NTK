#[derive(Debug)]
pub struct Profile {
    pub name: &'static str,
    pub power_limit_w: u32,
    pub fan_mode: &'static str,
}

pub fn get_profile(name: &str) -> Option<Profile> {
    match name {

        "battery" => Some(Profile {
            name: "battery",
            power_limit_w: 12,
            fan_mode: "silent",
        }),

        "laptop" => Some(Profile {
            name: "laptop",
            power_limit_w: 25,
            fan_mode: "balanced",
        }),

        "table" => Some(Profile {
            name: "table",
            power_limit_w: 35,
            fan_mode: "medium",
        }),

        "performance" => Some(Profile {
            name: "performance",
            power_limit_w: 45,
            fan_mode: "high",
        }),

        "extreme" => Some(Profile {
            name: "extreme",
            power_limit_w: 55,
            fan_mode: "max",
        }),

        _ => None,
    }
}