//! The loopback page a trailer plays in, because the video hosts refuse an embed whose referrer is not http(s).

use crate::sync::LockExt;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// How long the listener waits for its next request before it closes; the player has its page long before that.
const IDLE: Duration = Duration::from_secs(300);

/// The running listener's port and the token its URLs carry, so no other local page can borrow it.
static SERVER: Mutex<Option<(u16, String)>> = Mutex::new(None);

/// A trailer host Karasu embeds, parsed from AniList's `trailer.site`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Site {
    YouTube,
    Dailymotion,
}

impl Site {
    fn parse(site: &str) -> Option<Site> {
        match site {
            "youtube" => Some(Site::YouTube),
            "dailymotion" => Some(Site::Dailymotion),
            _ => None,
        }
    }

    fn embed(self, id: &str) -> String {
        match self {
            Site::YouTube => format!("https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0"),
            Site::Dailymotion => format!("https://www.dailymotion.com/embed/video/{id}?autoplay=1"),
        }
    }
}

/// A video id is a short run of URL-safe characters on both hosts; anything else never reaches the page.
fn valid_id(id: &str) -> bool {
    (1..=32).contains(&id.len()) && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

/// The URL the card's frame loads for this trailer, starting the listener when none is running.
pub fn page_url(site: &str, id: &str) -> Result<String, String> {
    if Site::parse(site).is_none() {
        return Err(format!("unknown trailer host {site}"));
    }
    if !valid_id(id) {
        return Err("not a video id".into());
    }
    let mut server = SERVER.guard();
    let (port, token) = match server.as_ref() {
        Some(running) => running.clone(),
        None => {
            let listener = TcpListener::bind(("127.0.0.1", 0)).map_err(|e| format!("cannot open the trailer page: {e}"))?;
            let port = listener.local_addr().map_err(|e| e.to_string())?.port();
            let token = new_token()?;
            let serving = token.clone();
            std::thread::spawn(move || serve(listener, &serving));
            *server = Some((port, token.clone()));
            (port, token)
        }
    };
    Ok(format!("http://127.0.0.1:{port}/{token}/{site}/{id}"))
}

fn new_token() -> Result<String, String> {
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).map_err(|e| e.to_string())?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

/// Answers until the listener has been idle for `IDLE`, then forgets itself so the next trailer opens a fresh one.
fn serve(listener: TcpListener, token: &str) {
    if listener.set_nonblocking(true).is_err() {
        SERVER.guard().take();
        return;
    }
    let mut last = Instant::now();
    loop {
        match listener.accept() {
            Ok((stream, _)) => {
                last = Instant::now();
                handle(stream, token);
            }
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                if last.elapsed() >= IDLE {
                    break;
                }
                std::thread::sleep(Duration::from_millis(100));
            }
            Err(_) => break,
        }
    }
    SERVER.guard().take();
}

fn handle(mut stream: TcpStream, token: &str) {
    let _ = stream.set_nonblocking(false);
    let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
    let mut buf = [0u8; 2048];
    let mut n = 0;
    // TCP may split a request anywhere, so read until the headers end, the buffer fills or the peer stops.
    while n < buf.len() && !buf[..n].windows(4).any(|w| w == b"\r\n\r\n") {
        match stream.read(&mut buf[n..]) {
            Ok(0) | Err(_) => break,
            Ok(read) => n += read,
        }
    }
    let request = String::from_utf8_lossy(&buf[..n]);
    let path = request.lines().next().and_then(|line| line.strip_prefix("GET ")).and_then(|rest| rest.split(' ').next());
    let response = match path.and_then(|p| route(p, token)) {
        Some(body) => respond(200, &body),
        None => respond(404, "Not found"),
    };
    let _ = stream.write_all(response.as_bytes());
}

/// The page for `/<token>/<site>/<id>`, or nothing for any other path.
fn route(path: &str, token: &str) -> Option<String> {
    let mut parts = path.trim_start_matches('/').split('/');
    let (given, site, id) = (parts.next()?, parts.next()?, parts.next()?);
    if parts.next().is_some() || given != token || !valid_id(id) {
        return None;
    }
    Some(player_page(&Site::parse(site)?.embed(id)))
}

fn player_page(embed: &str) -> String {
    format!(
        "<!doctype html><html><head><meta charset=\"utf-8\"><title>Trailer</title>\
<style>html,body{{margin:0;height:100%;background:#000;overflow:hidden}}iframe{{border:0;width:100%;height:100%}}</style>\
</head><body><iframe src=\"{embed}\" allow=\"autoplay; encrypted-media; fullscreen; picture-in-picture\" \
allowfullscreen referrerpolicy=\"strict-origin-when-cross-origin\"></iframe></body></html>"
    )
}

fn respond(status: u16, body: &str) -> String {
    let reason = if status == 200 { "OK" } else { "Not Found" };
    let kind = if status == 200 { "text/html; charset=utf-8" } else { "text/plain" };
    format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: {kind}\r\nContent-Length: {}\r\nCache-Control: no-store\r\n\
Referrer-Policy: strict-origin-when-cross-origin\r\n\
Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; \
frame-src https://www.youtube-nocookie.com https://www.dailymotion.com; \
frame-ancestors tauri://localhost http://tauri.localhost https://tauri.localhost http://localhost:1420\r\n\
Connection: close\r\n\r\n{body}",
        body.len()
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_url_safe_ids_pass() {
        assert!(valid_id("aqz-KE-bpKQ"));
        assert!(valid_id("x8abc_9"));
        assert!(!valid_id(""));
        assert!(!valid_id("a\"><script>"));
        assert!(!valid_id("../etc"));
        assert!(!valid_id(&"a".repeat(33)));
    }

    #[test]
    fn the_route_needs_the_token_a_known_host_and_a_valid_id() {
        assert!(route("/tok/youtube/aqz-KE-bpKQ", "tok").unwrap().contains("youtube-nocookie.com/embed/aqz-KE-bpKQ"));
        assert!(route("/tok/dailymotion/x8abc", "tok").unwrap().contains("dailymotion.com/embed/video/x8abc"));
        assert!(route("/other/youtube/aqz-KE-bpKQ", "tok").is_none());
        assert!(route("/tok/vimeo/123", "tok").is_none());
        assert!(route("/tok/youtube/bad%22id", "tok").is_none());
        assert!(route("/tok/youtube/aqz/extra", "tok").is_none());
    }

    #[test]
    fn page_url_refuses_what_the_route_would_refuse() {
        assert!(page_url("vimeo", "123").is_err());
        assert!(page_url("youtube", "a b").is_err());
    }

    /// Sends the request as the pieces given, each pause longer than the accept poll, and returns the whole answer.
    fn ask(pieces: &[&str]) -> String {
        let url = page_url("youtube", "aqz-KE-bpKQ").unwrap();
        let rest = url.strip_prefix("http://127.0.0.1:").unwrap();
        let (port, path) = rest.split_once('/').unwrap();
        let mut stream = TcpStream::connect(("127.0.0.1", port.parse::<u16>().unwrap())).unwrap();
        let request = format!("GET /{path} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n");
        let mut at = 0;
        for piece in pieces {
            let end = at + piece.len();
            stream.write_all(&request.as_bytes()[at..end]).unwrap();
            stream.flush().unwrap();
            std::thread::sleep(Duration::from_millis(300));
            at = end;
        }
        stream.write_all(&request.as_bytes()[at..]).unwrap();
        let mut answer = String::new();
        stream.read_to_string(&mut answer).unwrap();
        answer
    }

    #[test]
    fn the_listener_serves_its_page_over_loopback() {
        let answer = ask(&[]);
        assert!(answer.starts_with("HTTP/1.1 200"));
        assert!(answer.contains("youtube-nocookie.com/embed/aqz-KE-bpKQ"));
    }

    #[test]
    fn a_request_that_arrives_in_pieces_is_read_whole() {
        // The path sits in the second piece, so an answer after the first read would be a 404.
        let answer = ask(&["GET /"]);
        assert!(answer.starts_with("HTTP/1.1 200"), "{answer}");
    }
}
