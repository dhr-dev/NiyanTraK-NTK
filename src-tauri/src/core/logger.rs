use std::sync::{Mutex, OnceLock};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

#[derive(Clone, Debug)]
pub struct LogEntry {
    pub timestamp: Instant,
    pub wall_time: String,
    pub message: String,
}

static LOG_BUFFER: OnceLock<Mutex<Vec<LogEntry>>> = OnceLock::new();

fn get_buffer() -> &'static Mutex<Vec<LogEntry>> {
    LOG_BUFFER.get_or_init(|| Mutex::new(Vec::new()))
}

/// Dynamic logger that logs debug entries, keeping only the last 2 minutes (120 seconds)
pub fn add_log(msg: &str) {
    if let Ok(mut buffer) = get_buffer().lock() {
        let now = Instant::now();
        
        // Simple, portable time stamp formatter (HH:MM:SS)
        let wall_time = match SystemTime::now().duration_since(UNIX_EPOCH) {
            Ok(d) => {
                let total_secs = d.as_secs();
                let hours = (total_secs / 3600) % 24;
                let minutes = (total_secs / 60) % 60;
                let seconds = total_secs % 60;
                format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
            }
            Err(_) => String::from("00:00:00"),
        };

        buffer.push(LogEntry {
            timestamp: now,
            wall_time,
            message: msg.to_string(),
        });

        // Sliding window: keep only entries <= 120 seconds old
        buffer.retain(|entry| now.duration_since(entry.timestamp).as_secs() <= 120);
    }
}

/// Formats and returns all logs registered in the last 120 seconds (2 minutes)
pub fn get_recent_logs() -> String {
    if let Ok(mut buffer) = get_buffer().lock() {
        let now = Instant::now();
        
        // Retain fresh logs before building the string
        buffer.retain(|entry| now.duration_since(entry.timestamp).as_secs() <= 120);

        let mut out = String::new();
        out.push_str("===============================================\n");
        out.push_str("          VictusDeck 2m Debug Logs             \n");
        out.push_str("===============================================\n\n");

        if buffer.is_empty() {
            out.push_str("[System info] No logs registered in the last 2 minutes.\n");
        } else {
            for entry in buffer.iter() {
                out.push_str(&format!("[{}] {}\n", entry.wall_time, entry.message));
            }
        }
        out
    } else {
        String::from("Error: Logging buffer mutex failed to lock.")
    }
}
