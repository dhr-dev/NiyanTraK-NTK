use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;

static STRESS_ACTIVE: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub fn start_cpu_stress() -> bool {
    if STRESS_ACTIVE.swap(true, Ordering::SeqCst) {
        // Already active
        return true;
    }

    let num_cores = thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(8);

    println!("[Stress Test] Starting CPU Stress Test with {} threads", num_cores);

    for i in 0..num_cores {
        thread::spawn(move || {
            println!("[Stress Test] Thread {} started", i);
            let mut x: f64 = 1.0001;
            while STRESS_ACTIVE.load(Ordering::Relaxed) {
                // Perform heavy FPU/ALU computations to fully load core threads
                for _ in 0..5000 {
                    x = (x + 0.0001).sqrt().sin().cos();
                }
                // Yield to ensure OS and VictusDeck UI threads remain completely responsive
                thread::yield_now();
            }
            println!("[Stress Test] Thread {} stopped", i);
        });
    }

    true
}

#[tauri::command]
pub fn stop_cpu_stress() -> bool {
    println!("[Stress Test] Stopping CPU Stress Test");
    STRESS_ACTIVE.store(false, Ordering::SeqCst);
    false
}

#[tauri::command]
pub fn get_stress_status() -> bool {
    STRESS_ACTIVE.load(Ordering::SeqCst)
}
