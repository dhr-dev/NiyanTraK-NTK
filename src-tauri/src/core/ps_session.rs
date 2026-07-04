use std::process::{Command, Child, Stdio};
use std::io::{Write, BufReader, BufRead};
use std::sync::{Mutex, OnceLock};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

pub struct PsSession {
    child: Child,
    stdout_reader: BufReader<std::process::ChildStdout>,
}

impl PsSession {
    fn new() -> std::io::Result<Self> {
        let mut cmd = Command::new("powershell");
        cmd.args(["-NoProfile", "-NoExit", "-Command", "-"]);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        #[cfg(windows)]
        cmd.creation_flags(0x08004000); // CREATE_NO_WINDOW | BELOW_NORMAL_PRIORITY_CLASS

        let mut child = cmd.spawn()?;
            
        let stdout = child.stdout.take().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::Other, "Failed to capture stdout")
        })?;
        
        Ok(Self {
            child,
            stdout_reader: BufReader::new(stdout),
        })
    }

    fn send_command(&mut self, cmd: &str) -> std::io::Result<String> {
        let stdin = self.child.stdin.as_mut().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::Other, "Failed to capture stdin")
        })?;

        // Write the command, redirect stderr to stdout, and write the sentinel marker
        writeln!(stdin, "{} 2>&1; Write-Output \"__PS_CMD_DONE__\"", cmd)?;
        stdin.flush()?;

        let mut output = String::new();
        let mut line = String::new();

        loop {
            line.clear();
            let bytes_read = self.stdout_reader.read_line(&mut line)?;
            if bytes_read == 0 {
                // EOF reached (process probably died)
                return Err(std::io::Error::new(
                    std::io::ErrorKind::BrokenPipe,
                    "PowerShell stdout EOF reached (process died)",
                ));
            }

            if line.trim() == "__PS_CMD_DONE__" {
                break;
            }

            output.push_str(&line);
        }

        Ok(output)
    }
}

// Global thread-safe instance
static SESSION: OnceLock<Mutex<Option<PsSession>>> = OnceLock::new();

fn get_session() -> &'static Mutex<Option<PsSession>> {
    SESSION.get_or_init(|| Mutex::new(None))
}

pub fn run_command(cmd: &str) -> std::io::Result<String> {
    let mut lock = get_session().lock().unwrap();
    if lock.is_none() {
        match PsSession::new() {
            Ok(session) => {
                *lock = Some(session);
                println!("[PsSession] Persistent PowerShell session started.");
            }
            Err(e) => {
                return Err(e);
            }
        }
    }

    if let Some(ref mut session) = *lock {
        match session.send_command(cmd) {
            Ok(out) => Ok(out),
            Err(e) => {
                // If it failed (e.g. process died), try restarting it once
                println!("[PsSession] Command failed ({:?}), restarting session...", e);
                *lock = None;
                match PsSession::new() {
                    Ok(mut new_session) => {
                        let res = new_session.send_command(cmd);
                        *lock = Some(new_session);
                        res
                    }
                    Err(restart_err) => Err(restart_err),
                }
            }
        }
    } else {
        Err(std::io::Error::new(std::io::ErrorKind::Other, "Failed to initialize PowerShell session"))
    }
}
