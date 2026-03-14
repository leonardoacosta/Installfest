use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use std::process::Command;
use tiny_http::{Header, Method, Request, Response, Server};

const BIND_ADDR: &str = "0.0.0.0:10998";

// --- Request types ---

#[derive(Deserialize)]
struct HookRequest {
    event: String,
    workspace_id: Option<String>,
    surface_id: Option<String>,
}

#[derive(Deserialize)]
struct AttentionRequest {
    action: String,
    #[serde(default)]
    flash: bool,
    workspace_id: Option<String>,
    surface_id: Option<String>,
}

#[derive(Deserialize)]
struct NotifyRequest {
    title: String,
    body: Option<String>,
    subtitle: Option<String>,
    workspace_id: Option<String>,
    surface_id: Option<String>,
}

// --- Response types ---

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    cmux: bool,
}

#[derive(Serialize)]
struct OkResponse {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    output: Option<String>,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

// --- IP validation ---

fn is_allowed_ip(addr: IpAddr) -> bool {
    match addr {
        IpAddr::V4(v4) => {
            // localhost
            if v4.is_loopback() {
                return true;
            }
            // Tailscale CGNAT: 100.64.0.0/10 (100.64.0.0 - 100.127.255.255)
            let octets = v4.octets();
            octets[0] == 100 && (octets[1] & 0xC0) == 64
        }
        IpAddr::V6(v6) => v6.is_loopback(),
    }
}

// --- cmux helpers ---

fn cmux_available() -> bool {
    Command::new("cmux")
        .arg("ping")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn run_cmux(
    args: &[&str],
    workspace_id: Option<&str>,
    surface_id: Option<&str>,
) -> Result<String, String> {
    let mut cmd = Command::new("cmux");
    cmd.args(args);
    if let Some(ws) = workspace_id {
        cmd.env("CMUX_WORKSPACE_ID", ws);
    }
    if let Some(sf) = surface_id {
        cmd.env("CMUX_SURFACE_ID", sf);
    }
    let output = cmd
        .output()
        .map_err(|e| format!("failed to execute cmux: {e}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("cmux exited {}: {stderr}", output.status))
    }
}

// --- Handlers ---

fn handle_health() -> Response<std::io::Cursor<Vec<u8>>> {
    let resp = HealthResponse {
        status: "ok",
        cmux: cmux_available(),
    };
    json_response(200, &resp)
}

fn handle_hook(body: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let req: HookRequest = match serde_json::from_str(body) {
        Ok(r) => r,
        Err(e) => return json_error(400, &format!("invalid json: {e}")),
    };

    let allowed_events = ["session-start", "stop", "notification"];
    if !allowed_events.contains(&req.event.as_str()) {
        return json_error(400, &format!("invalid event: {}", req.event));
    }

    let mut args = vec!["claude-hook", req.event.as_str()];
    let ws_flag;
    if let Some(ref ws) = req.workspace_id {
        ws_flag = ws.clone();
        args.push("--workspace");
        args.push(&ws_flag);
    }
    let sf_flag;
    if let Some(ref sf) = req.surface_id {
        sf_flag = sf.clone();
        args.push("--surface");
        args.push(&sf_flag);
    }

    match run_cmux(&args, req.workspace_id.as_deref(), req.surface_id.as_deref()) {
        Ok(out) => json_response(
            200,
            &OkResponse {
                ok: true,
                output: if out.is_empty() { None } else { Some(out) },
            },
        ),
        Err(e) => json_error(502, &e),
    }
}

fn handle_attention(body: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let req: AttentionRequest = match serde_json::from_str(body) {
        Ok(r) => r,
        Err(e) => return json_error(400, &format!("invalid json: {e}")),
    };

    let action = match req.action.as_str() {
        "set" => "mark-unread",
        "clear" => "mark-read",
        _ => return json_error(400, &format!("invalid action: {}", req.action)),
    };

    let mut args = vec!["workspace-action", "--action", action];
    let ws_flag;
    if let Some(ref ws) = req.workspace_id {
        ws_flag = ws.clone();
        args.push("--workspace");
        args.push(&ws_flag);
    }

    if let Err(e) = run_cmux(&args, req.workspace_id.as_deref(), req.surface_id.as_deref()) {
        return json_error(502, &e);
    }

    if req.flash {
        let mut flash_args = vec!["trigger-flash"];
        let ws_flag2;
        if let Some(ref ws) = req.workspace_id {
            ws_flag2 = ws.clone();
            flash_args.push("--workspace");
            flash_args.push(&ws_flag2);
        }
        let sf_flag2;
        if let Some(ref sf) = req.surface_id {
            sf_flag2 = sf.clone();
            flash_args.push("--surface");
            flash_args.push(&sf_flag2);
        }
        let _ = run_cmux(&flash_args, req.workspace_id.as_deref(), req.surface_id.as_deref());
    }

    json_response(200, &OkResponse { ok: true, output: None })
}

fn handle_notify(body: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let req: NotifyRequest = match serde_json::from_str(body) {
        Ok(r) => r,
        Err(e) => return json_error(400, &format!("invalid json: {e}")),
    };

    let mut args = vec!["notify", "--title"];
    let title = req.title.clone();
    args.push(&title);

    let body_val;
    if let Some(ref b) = req.body {
        body_val = b.clone();
        args.push("--body");
        args.push(&body_val);
    }

    let subtitle_val;
    if let Some(ref s) = req.subtitle {
        subtitle_val = s.clone();
        args.push("--subtitle");
        args.push(&subtitle_val);
    }

    let ws_flag;
    if let Some(ref ws) = req.workspace_id {
        ws_flag = ws.clone();
        args.push("--workspace");
        args.push(&ws_flag);
    }

    let sf_flag;
    if let Some(ref sf) = req.surface_id {
        sf_flag = sf.clone();
        args.push("--surface");
        args.push(&sf_flag);
    }

    match run_cmux(&args, req.workspace_id.as_deref(), req.surface_id.as_deref()) {
        Ok(out) => json_response(
            200,
            &OkResponse {
                ok: true,
                output: if out.is_empty() { None } else { Some(out) },
            },
        ),
        Err(e) => json_error(502, &e),
    }
}

// --- Response helpers ---

fn json_response<T: Serialize>(status: u16, body: &T) -> Response<std::io::Cursor<Vec<u8>>> {
    let json = serde_json::to_string(body).unwrap();
    Response::from_string(json)
        .with_status_code(status)
        .with_header(
            Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap(),
        )
}

fn json_error(status: u16, msg: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    json_response(status, &ErrorResponse { error: msg.to_string() })
}

// --- Main ---

fn main() {
    eprintln!("cmux-bridge starting on {BIND_ADDR}");

    let server = Server::http(BIND_ADDR).expect("failed to bind");
    server
        .incoming_requests()
        .for_each(|req| handle_request(req, &server));
}

fn handle_request(mut req: Request, _server: &Server) {
    let peer_ip = req.remote_addr().map(|a| a.ip());

    if let Some(ip) = peer_ip {
        if !is_allowed_ip(ip) {
            eprintln!("rejected connection from {ip}");
            let _ = req.respond(json_error(403, "forbidden"));
            return;
        }
    }

    let method = req.method().clone();
    let url = req.url().to_string();

    // Read body for POST requests
    let mut body = String::new();
    if method == Method::Post {
        if let Err(e) = req.as_reader().read_to_string(&mut body) {
            let _ = req.respond(json_error(400, &format!("failed to read body: {e}")));
            return;
        }
    }

    eprintln!("{method} {url}");

    let response = match (method, url.as_str()) {
        (Method::Get, "/health") => handle_health(),
        (Method::Post, "/cmux/hook") => handle_hook(&body),
        (Method::Post, "/cmux/attention") => handle_attention(&body),
        (Method::Post, "/cmux/notify") => handle_notify(&body),
        _ => json_error(404, "not found"),
    };

    let _ = req.respond(response);
}
